import { useState } from 'react';
import { Link } from 'react-router-dom';

const hue = (s) => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;

// Cover art is an uploaded image named cover_<story-id> (Studio -> Media). Without one, a generated gradient is used.
export default function StoryCard({ story, progress }) {
  const [hasImg, setHasImg] = useState(false);
  const done = progress?.completed?.length ?? 0;
  const status = !progress ? null
    : done >= story.episodeCount ? 'Completed'
    : progress.sceneId ? `Episode ${done + 1} in progress`
    : `${done}/${story.episodeCount} done`;

  return (
    <Link to={`/story/${story.id}`} className="story-card" style={{ '--h': hue(story.id) }}>
      <div className="story-cover">
        <img src={`/api/media/cover_${story.id}`} alt="" loading="lazy"
          style={{ display: hasImg ? 'block' : 'none' }}
          onLoad={() => setHasImg(true)} onError={() => setHasImg(false)} />
        {!hasImg && <span className="display">{story.title}</span>}
        {status && <em className="story-badge">{status}</em>}
      </div>
      <p>{story.tagline}</p>
      <small>{story.genre.join(' · ')} · {story.episodeCount} episode{story.episodeCount === 1 ? '' : 's'}</small>
    </Link>
  );
}
