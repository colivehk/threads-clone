Round14 restores two image interaction details:

1. In multi-image posts, clicking any specific image now opens the lightbox/carousel starting from that exact image.
2. Cursor behavior is aligned closer to Threads:
   - single image: pointer hand on hover
   - multi image: open-hand style while hover/ready to drag (`grab`)
   - multi image while dragging: closed-hand style (`grabbing`)

Changed file:
- components/ThreadCard.tsx
