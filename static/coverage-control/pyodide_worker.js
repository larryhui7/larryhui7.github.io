// Runs demos.py and geometry.py in the browser with Pyodide, for hosting the demos on a static website.
// index.html starts this worker when it finds no app.py server. It answers the same requests as app.py:
//   {id, path: 'api/catalog' | 'api/create' | 'api/advance' | 'api/action', body}  ->  {id, result} or {id, error}
importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');

// Python side of the bridge: the session handling of app.py without the HTTP server.
const BRIDGE = `
import json, sys
sys.path.insert(0, '.')
import numpy as np
from demos import Demo, PAGES, defaults

SESSIONS = {}
COUNTER = 0


def encode(x):
    if isinstance(x, np.ndarray):
        return x.tolist()
    if isinstance(x, np.generic):
        return x.item()
    raise TypeError(type(x).__name__)


def dispatch(path, body):
    global COUNTER
    if path == 'api/catalog':
        return {'pages': [dict(p, defaults=defaults(p['id'])) for p in PAGES]}
    if path == 'api/create':
        demo = Demo(body.get('page', 'lloyd'), body.get('config', {}))
        SESSIONS.pop(body.get('replace'), None)
        COUNTER += 1
        key = str(COUNTER)
        SESSIONS[key] = demo
        return {'id': key, 'config': demo.cfg, 'state': demo.snapshot(True),
                'domain': demo.domain, 'heatmap': demo.heatmap()}
    demo = SESSIONS.get(body.get('id'))
    if demo is None:
        raise ValueError('Session expired. Apply & reset this demo.')
    if path == 'api/advance':
        return demo.advance()
    if path == 'api/action':
        return demo.action(body['action'], body.get('values', {}))
    raise ValueError('Unknown API operation')


def handle(path, body):
    try:
        return json.dumps({'result': dispatch(path, json.loads(body))}, default=encode, allow_nan=False)
    except (ValueError, KeyError, TypeError) as e:
        return json.dumps({'error': str(e)})
    except Exception as e:
        return json.dumps({'error': f'Numerical operation failed: {e}. Try a smaller dt or reset.'})
`;

const ready = (async () => {
    const pyodide = await loadPyodide();
    await pyodide.loadPackage('numpy');
    for (const file of ['geometry.py', 'demos.py']) {
        const r = await fetch(file);
        if (!r.ok) throw Error('Could not load ' + file);
        pyodide.FS.writeFile(file, await r.text());
    }
    pyodide.runPython(BRIDGE);
    return pyodide.globals.get('handle');
})();

onmessage = async e => {
    const { id, path, body } = e.data;
    try {
        const handle = await ready;
        postMessage({ id, ...JSON.parse(handle(path, JSON.stringify(body))) });
    } catch (err) {
        postMessage({ id, error: 'Could not start Python in the browser. ' + err });
    }
};
