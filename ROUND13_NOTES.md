Round 13: restore image interaction behavior

Changed file:
- components/ThreadCard.tsx

What this restores:
- Single image: clicking the image opens the lightbox instead of entering the thread detail page.
- Multiple images: images can be dragged horizontally.
- Multiple images: releasing after dragging no longer opens the thread detail page.
- Multiple images: clicking any image opens the lightbox/carousel at the clicked image.
- Lightbox: supports previous/next navigation more safely and adds keyboard navigation (Esc / ← / →).

Apply:
  tar xzvf threads_refactor_round13_restore_image_interactions.tar.gz -C threads-clone --strip-components=1
  cd ~/threads-clone
  rm -rf .next
  npm run dev
