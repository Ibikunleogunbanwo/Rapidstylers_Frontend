import { GALLERY_TABS } from "./galleryCategories";

export const SERVICE_INSPIRATION = [
  {
    "name": "Locs & dreadlocks",
    "images": [
      {
        "src": "/images/inspiration/locs-1.jpg",
        "alt": "Long locs"
      },
      {
        "src": "/images/inspiration/locs-2.jpg",
        "alt": "Locs tied back"
      },
      {
        "src": "/images/inspiration/locs-3.jpg",
        "alt": "Loc updo"
      }
    ]
  },
  {
    "name": "Buzz cut",
    "images": [
      {
        "src": "/images/inspiration/buzz-1.jpg",
        "alt": "Barber giving a buzz cut"
      },
      {
        "src": "/images/inspiration/buzz-2.jpg",
        "alt": "Sculpted buzz cut"
      },
      {
        "src": "/images/inspiration/buzz-3.jpg",
        "alt": "Textured buzz cut"
      }
    ]
  },
  {
    "name": "Braids",
    "images": [
      {
        "src": "/images/inspiration/braids-1.jpg",
        "alt": "Knotless box braids"
      },
      {
        "src": "/images/inspiration/braids-2.jpg",
        "alt": "Shoulder length braids"
      },
      {
        "src": "/images/inspiration/braids-3.jpg",
        "alt": "Braided ponytail"
      }
    ]
  },
  {
    "name": "Cornrows",
    "images": [
      {
        "src": "/images/inspiration/cornrows-1.jpg",
        "alt": "Straight back cornrows"
      },
      {
        "src": "/images/inspiration/cornrows-2.jpg",
        "alt": "Cornrows with clean partings"
      },
      {
        "src": "/images/inspiration/cornrows-3.jpg",
        "alt": "Cornrow braided bun"
      }
    ]
  },
  {
    "name": "Wigs",
    "images": [
      {
        "src": "/images/inspiration/wigs-1.jpg",
        "alt": "Long wavy wig"
      },
      {
        "src": "/images/inspiration/wigs-2.jpg",
        "alt": "Sleek bob wig"
      },
      {
        "src": "/images/inspiration/wigs-3.jpg",
        "alt": "Curly wig"
      }
    ]
  },
  {
    "name": "High-top fade",
    "images": [
      {
        "src": "/images/inspiration/high-top-1.jpg",
        "alt": "Classic flat top"
      },
      {
        "src": "/images/inspiration/high-top-2.jpg",
        "alt": "Rounded high top"
      },
      {
        "src": "/images/inspiration/high-top-3.jpg",
        "alt": "Twisted high top"
      }
    ]
  },
  {
    "name": "Hair dye",
    "images": [
      {
        "src": "/images/inspiration/colour-1.jpg",
        "alt": "Auburn curls"
      },
      {
        "src": "/images/inspiration/colour-2.jpg",
        "alt": "Honey blonde highlights"
      },
      {
        "src": "/images/inspiration/colour-3.jpg",
        "alt": "Platinum curl tips"
      }
    ]
  },
  {
    "name": "Nail Technician",
    "images": [
      {
        "src": "/images/inspiration/nails-1.jpg",
        "alt": "Nail technician painting a client’s nails"
      },
      {
        "src": "/images/inspiration/nails-2.jpg",
        "alt": "French manicure"
      },
      {
        "src": "/images/inspiration/nails-3.jpg",
        "alt": "Burgundy manicure"
      }
    ]
  },
  {
    "name": "Makeup",
    "images": [
      {
        "src": "/images/inspiration/makeup-1.jpg",
        "alt": "Makeup artist applying blush"
      },
      {
        "src": "/images/inspiration/makeup-2.jpg",
        "alt": "Bridal makeup"
      },
      {
        "src": "/images/inspiration/makeup-3.jpg",
        "alt": "Evening makeup"
      }
    ]
  },
  {
    "name": "Eyelash extensions",
    "images": [
      {
        "src": "/images/inspiration/lashes-1.jpg",
        "alt": "Lash technician fitting extensions"
      },
      {
        "src": "/images/inspiration/lashes-2.jpg",
        "alt": "Wispy lash extensions"
      },
      {
        "src": "/images/inspiration/lashes-3.jpg",
        "alt": "Classic lash extensions"
      }
    ]
  },
  {
    "name": "Natural hair",
    "images": [
      {
        "src": "/images/inspiration/natural-1.jpg",
        "alt": "Rounded natural afro"
      },
      {
        "src": "/images/inspiration/natural-2.jpg",
        "alt": "Two strand twist out"
      },
      {
        "src": "/images/inspiration/natural-3.jpg",
        "alt": "Defined natural curls"
      }
    ]
  }
];

export const DEMO_INSPIRATION = SERVICE_INSPIRATION.flatMap(group => group.images.map(image => ({
  ...image,
  id: image.src.split("/").pop().replace(".jpg", ""),
  category: GALLERY_TABS.find(tab => tab.label === group.name).categories[0],
  photographer: "RapidStylers style inspiration",
  source: "generated",
  keywords: `${image.alt} ${group.name}`,
})));

export function searchDemoInspiration(query) {
  const tokens = String(query || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
  return DEMO_INSPIRATION.filter(photo => tokens.every(token => {
    const term = token.length > 3 ? token.replace(/s$/, "") : token;
    return photo.keywords.toLowerCase().includes(term);
  }));
}
