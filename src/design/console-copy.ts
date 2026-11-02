// Generated from console.en.json.
export const CONSOLE = {
  "app": "Console",
  "staffOnly": "Staff only",
  "search": "Search accounts, organisations, tournaments",
  "nav": [
    {
      "g": "Planary",
      "items": [
        {
          "id": "overview",
          "label": "Overview",
          "ic": "grid"
        },
        {
          "id": "status",
          "label": "Status",
          "ic": "pulse"
        },
        {
          "id": "customers",
          "label": "Customers",
          "ic": "org"
        },
        {
          "id": "support",
          "label": "Support",
          "ic": "inbox",
          "n": "6"
        }
      ]
    },
    {
      "g": "Apps",
      "items": [
        {
          "id": "tournament",
          "label": "Tournament",
          "ic": "bracket"
        },
        {
          "id": "casino",
          "label": "Casino",
          "ic": "chip"
        },
        {
          "id": "wishlist",
          "label": "Wishlist",
          "ic": "gift"
        },
        {
          "id": "vault",
          "label": "Vault",
          "ic": "lock"
        }
      ]
    },
    {
      "g": "Admin",
      "items": [
        {
          "id": "audit",
          "label": "Audit log",
          "ic": "scroll"
        },
        {
          "id": "staff",
          "label": "Staff and roles",
          "ic": "key"
        }
      ]
    }
  ],
  "sysUp": "All systems up",
  "sysDown": "Tournament down",
  "readOnly": "Read-only",
  "readOnlyBanner": "You have the Viewer role. You can look at everything here but can’t change anything.",
  "downBanner": {
    "t": "Tournament is down since 19:58.",
    "s": "3 live events are affected. Organisers see the last saved state.",
    "cta": "Open incident"
  },
  "theme": {
    "dark": "Switch to dark mode",
    "light": "Switch to light mode"
  },
  "signOut": "Sign out",
  "pages": {
    "overview": {
      "title": "Overview"
    },
    "status": {
      "title": "Status"
    },
    "incident": {
      "title": "Incident"
    },
    "customers": {
      "title": "Customers"
    },
    "customer": {
      "title": "Customer"
    },
    "support": {
      "title": "Support"
    },
    "tournament": {
      "title": "Tournament"
    },
    "casino": {
      "title": "Casino"
    },
    "wishlist": {
      "title": "Wishlist"
    },
    "vault": {
      "title": "Vault storage"
    },
    "audit": {
      "title": "Audit log"
    },
    "staff": {
      "title": "Staff and roles"
    }
  },
  "states": {
    "loading": "Loading the overview",
    "errorH": "Customers didn’t load",
    "errorP": "The billing service didn’t answer in time (503). Everything else in the Console still works.",
    "errorRetry": "Try again",
    "errorStatus": "Open status",
    "errorId": "Request ID",
    "emptyH": "Nothing open",
    "emptyP": "New requests from the customer portal land here. You get a notification when one is assigned to you.",
    "viewerNote": "Viewers can read notes but can’t add them."
  },
  "wishlistPrivacy": {
    "h": "What staff can’t see",
    "p": "The Wishlist API only answers with totals. There is no endpoint that returns a person’s lists, items or reservations, also not for Owners.",
    "li": [
      "Who reserved which item",
      "What is on someone’s list",
      "Who a list is shared with"
    ]
  },
  "matrix": [
    [
      "Overview and status",
      "Edit",
      "Edit",
      "Read",
      "Read"
    ],
    [
      "Incidents and roll-back",
      "Edit",
      "Edit",
      "Read",
      "Read"
    ],
    [
      "Customers and plans",
      "Edit",
      "Edit",
      "Read",
      "Read"
    ],
    [
      "Customer notes",
      "Edit",
      "Edit",
      "Edit",
      "Read"
    ],
    [
      "Support inbox",
      "Edit",
      "Edit",
      "Edit",
      "Read"
    ],
    [
      "Tournament",
      "Edit",
      "Edit",
      "Read",
      "Read"
    ],
    [
      "Casino (chips, games, economy)",
      "Edit",
      "Edit",
      "No",
      "No"
    ],
    [
      "Casino moderation",
      "Edit",
      "Edit",
      "Edit",
      "Read"
    ],
    [
      "Wishlist totals",
      "Read",
      "Read",
      "Read",
      "Read"
    ],
    [
      "Vault storage per person",
      "Read",
      "Read",
      "Read",
      "No"
    ],
    [
      "Audit log",
      "Read",
      "Read",
      "No",
      "No"
    ],
    [
      "Staff and roles",
      "Edit",
      "No",
      "No",
      "No"
    ]
  ]
} as const;
