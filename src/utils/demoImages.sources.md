# Demo profile sample images

Fictional sample service images generated with the built-in image generation tool on 20 October 2026. Files are optimized WebP in `public/images/demo/`. These illustrate services, not actual work uploaded by the fictional seeded professionals. Existing curated photographs remain in `public/images/gallery/`.

All prompts used this shared specification:

> Photorealistic-natural. Standalone landscape 4:3 sample service photograph for a fictional RapidStylers demo stylist profile. [Scene below.] Keep full face and relevant hair or eye details comfortably within frame, premium natural photography, believable anatomy. No text, collage, logos, watermark or UI. Illustrative sample image, not an actual professional's work.

- `/images/demo/lashes-4.webp`: Close-up beauty photograph of a Black woman's closed eye showing a tasteful natural classic lash extension set, side angle, warm ivory salon backdrop, realistic eyelid and lashes.
- `/images/demo/lashes-5.webp`: Beauty editorial portrait of a Black woman with deep brown skin and short natural coily hair with softly curled volume eyelash extensions, looking slightly downward, pale lavender studio background, natural skin texture.
- `/images/demo/barber-4.webp`: Barbershop editorial portrait of a Black man with a clean low taper fade and short natural curls, three-quarter side profile, modern bright shop, no barber tools touching him.
- `/images/demo/barber-5.webp`: Barbershop editorial portrait of a man with brown skin and a neatly shaped beard and textured short crop haircut, side profile, softly lit contemporary shop.
- `/images/demo/makeup-4.webp`: Beauty editorial portrait of a Black woman with warm bronze soft glam makeup and muted rose lipstick, looking toward camera, warm neutral studio background.
- `/images/demo/makeup-5.webp`: Beauty editorial portrait of a Black woman with dark brown skin and a short sculpted natural afro with fresh luminous makeup, soft pink blush and natural lips, looking toward camera, cool ivory studio backdrop.

Backend seed assignments choose one image per ordinal (1–5) within each category. Relative URLs use the current frontend origin. Deploy these assets before refreshing demo database profiles. Existing uploaded image URLs are never replaced by the refresh; only empty images and the explicit list of superseded seed sample URLs are eligible.


## Casting revision

The project owner requested Black subjects only for the marketing/demo samples. The built-in image generator was used for replacements, with this shared prompt: “Photorealistic-natural. Standalone landscape 4:3 service sample for a fictional RapidStylers demo profile. [Scene.] Cast Black subjects only. Premium beauty photography, believable anatomy, no text, collage, logos, watermark or UI.”

Additional files in public/images/demo/:
- nails-1.webp: A Black woman's dark brown hands with glossy cherry red almond nails, soft ivory tabletop.
- nails-2.webp: A Black woman's deep brown hands with blush pink oval nails and delicate white French tips, pale lilac backdrop.
- nails-3.webp: A Black woman's rich brown hands with deep burgundy short square nails, warm cream tabletop.
- nails-4.webp: A Black woman's dark brown hands with nude caramel almond nails and delicate gold accents, neutral backdrop.
- lashes-1.webp: A Black woman with dark brown skin reclining for a lash appointment, eyes closed, classic extensions, bright salon.
- lashes-2.webp: Close-up of a Black woman's closed eye, deep brown skin and separated wispy extensions, studio lighting.
- lashes-3.webp: A Black woman with rich brown skin, neat natural braids and hybrid extensions, eyes lowered, ivory salon background.

Existing customer-uploaded images are not modified. The revised demo assignments replace the earlier nail/lash sample selection and use g-natural-hair-4 instead of g-natural-hair-1.
