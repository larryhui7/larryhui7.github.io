---
title: "Miscellaneous (Fun)"
description: "Travel, Food, Music, Flying, and More"
hideMeta: true
---

<style>
.fun-section {
  margin-bottom: 3rem;
}

.fun-section h2 {
  font-size: 1.4rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  padding-bottom: 0.4rem;
  border-bottom: 2px solid maroon;
}

.fun-intro {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Travel Map */
.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.map-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.travel-stats {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: maroon;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--secondary);
}

/* Album Grid */
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 1rem;
}

.album-card {
  text-align: center;
  transition: transform 0.2s ease;
}

.album-card:hover {
  transform: scale(1.05);
}

.album-card img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.album-card a {
  text-decoration: none;
}

.album-title {
  margin-top: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.album-artist {
  font-size: 0.8rem;
  color: var(--secondary);
}

/* Content Cards */
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.content-card {
  background: var(--code-bg);
  border-radius: 8px;
  padding: 1.2rem;
  border-left: 4px solid maroon;
}

.content-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.content-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--secondary);
}

/* List Style */
.fun-list {
  list-style: none;
  padding: 0;
}

.fun-list li {
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fun-list li:last-child {
  border-bottom: none;
}

.item-title {
  font-weight: 600;
}

.item-meta {
  font-size: 0.85rem;
  color: var(--secondary);
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  background: maroon;
  color: white;
}

.status-reading { background: #2563eb; }
.status-watching { background: #7c3aed; }
.status-queued { background: #6b7280; }

@media (max-width: 600px) {
  .album-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .travel-stats {
    justify-content: center;
  }
}
</style>

<p class="fun-intro">
Not everything in the world is so serious! Apart from the academics, here are some things I enjoy. Explore the map to see where I've traveled, check out my music taste, and discover what I'm reading and watching.
</p>

<div class="fun-section">
<h2>🗺️ Places I've Traveled</h2>
<div class="map-container">
<iframe src="https://www.google.com/maps/d/u/0/embed?mid=1JEdAVm8y1198hvnk2LE2BlxZtjv4QaY&ehbc=2E312F" width="100%" height="400"></iframe>
</div>
<div class="travel-stats">
<div class="stat-item">
<div class="stat-number">40+</div>
<div class="stat-label">Countries</div>
</div>
<div class="stat-item">
<div class="stat-number">100+</div>
<div class="stat-label">Cities</div>
</div>
<div class="stat-item">
<div class="stat-number">4</div>
<div class="stat-label">Continents</div>
</div>
</div>
</div>

<div class="fun-section">
<h2>🎵 Current Music</h2>
<p>Some albums I've been listening to on repeat:</p>
<div class="album-grid">
<div class="album-card">
<a href="https://open.spotify.com/track/75IQVo8hqI1iwVZyvkN2VT" target="_blank">
<img src="https://t2.genius.com/unsafe/417x417/https%3A%2F%2Fimages.genius.com%2F4da53da832363231cac36ad414e38a28.1000x1000x1.png" alt=" Jazz">
<div class="album-title">Oncle Jazz</div>
<div class="album-artist">Men I Trust</div>
</a>
</div>
<div class="album-card">
<a href="https://open.spotify.com/album/7z9NFSRufj49W9kaD2rORj" target="_blank">
<img src="https://i.scdn.co/image/ab67616d0000b273d4cbc712774c49532e7bbd3c" alt="Tchaikovsky: Piano Concerto No. 1">
<div class="album-title">Tchaikovsky: Piano Concerto No. 1</div>
<div class="album-artist">Evegeny Kissin, Berlin Philharmoniker, Herbert von Karajan</div>
</a>
</div>
<div class="album-card">
<a href="https://open.spotify.com/album/7aJuG4TFXa2hmE4z1yxc3n" target="_blank">
<img src="https://media.pitchfork.com/photos/6614092742a7de97785c7a48/master/pass/Billie-Eilish-Hit-Me-Hard-and-Soft.jpg" alt="Album 3">
<div class="album-title">Hit Me Hard and Soft</div>
<div class="album-artist">Billie Eilish</div>
</a>
</div>
</div>
</div>

<div class="fun-section">
<h2>🍳 Cooking Adventures</h2>
<p>I love experimenting in the kitchen. Here are some recent favorites:</p>
<div class="content-grid">
<div class="content-card">
<h3>Signature Dishes</h3>
<p>Maple glazed pan-roasted carrots with blueberries, French onion soup, 5 spice duck breast</p>
</div>
<div class="content-card">
<h3>Current Obsession</h3>
<p>Trying to make the best Japanese curry from scratch and experimenting with making vegetables tolerable</p>
</div>
<div class="content-card">
<h3>Favorite Cuisine</h3>
<p>Japanese, French, Modern</p>
</div>
</div>
</div>

<div class="fun-section">
<h2>✈️ Flying</h2>
<p>Private pilot with a passion for aviation. Currently building hours and working on my instrument rating and commerical licence.</p>
<div class="content-grid">
<div class="content-card">
<h3>Certificates & Endorsements</h3>
<p>FAA and Transport Canada Private Pilot's Licence, High-performance endorsement, Complex aircraft endorsement</p>
</div>
<div class="content-card">
<h3>Favorite Aircraft</h3>
<p>Mitsubishi A6M Zero, a matte black Aero L-39 Albatros with orange highlights</p>
</div>
<div class="content-card">
<h3>In Progress</h3>
<p>Instrument Rating (IFR) — learning to fly in the clouds!</p>
</div>
</div>
</div>

<div class="fun-section">
<h2>📚 Current Reads</h2>
<ul class="fun-list">
<li>
<div>
<span class="item-title">Froissart's Chronicles</span>
<div class="item-meta">Jean Froissart</div>
</div>
<span class="status-badge status-reading">Reading</span>
</li>
<li>
<div>
<span class="item-title">Conversations with Friends</span>
<div class="item-meta">Sally Rooney</div>
</div>
<span class="status-badge status-queued">Up Next</span>
</li>
<li>
<div>
<span class="item-title">No Longer Human</span>
<div class="item-meta">Osamu Dazai</div>
</div>
<span class="status-badge status-queued">Up Next</span>
</li>
</ul>
</div>

<div class="fun-section">
<h2>🎬 Watchlist</h2>
<p>TV shows and movies I'm currently watching or have queued up:</p>

<h3 style="margin-top: 1.5rem; font-size: 1rem;">TV Shows</h3>
<ul class="fun-list">
<li>
<div>
<span class="item-title">Better Call Saul</span>
<div class="item-meta">Drama • AMC</div>
</div>
<span class="status-badge status-watching">Watching</span>
</li>
<li>
<div>
<span class="item-title">Lupin</span>
<div class="item-meta">French Drama/Thriller • Netflix</div>
</div>
<span class="status-badge status-queued">Queued</span>
</li>
</ul>

<h3 style="margin-top: 1.5rem; font-size: 1rem;">Movies</h3>
<ul class="fun-list">
<li>
<div>
<span class="item-title">Inglourious Basterds</span>
<div class="item-meta">War/Drama • Tarantino</div>
</div>
<span class="status-badge" style="background: #059669;">Favorite</span>
</li>
<li>
<div>
<span class="item-title">Ballerina</span>
<div class="item-meta">Action/Thriller • Wiseman</div>
</div>
<span class="status-badge status-queued">Queued</span>
</li>
</ul>
</div>