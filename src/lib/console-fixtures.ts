// Sample data the prototype shows. For tests and Storybook-style fixtures, not for production.
export const CONSOLE_FIXTURES = {
  "me": {
    "name": "Mykyta Pantelei",
    "ini": "MP",
    "role": "Owner"
  },
  "viewer": {
    "name": "Tim Roth",
    "ini": "TR",
    "role": "Viewer"
  },
  "kpis": [
    {
      "l": "Accounts",
      "v": "12’480",
      "s": "+312 in 7 days",
      "up": true
    },
    {
      "l": "Active today",
      "v": "1’906",
      "s": "across all apps"
    },
    {
      "l": "Organisations",
      "v": "252",
      "s": "38 on a paid plan"
    },
    {
      "l": "Open support requests",
      "v": "6",
      "s": "2 unassigned"
    }
  ],
  "signups": [
    66,
    54,
    58,
    48,
    25,
    43,
    36,
    31,
    57,
    54,
    60,
    62,
    49,
    48,
    28,
    20,
    44,
    47,
    55,
    94,
    67,
    44,
    38,
    18,
    32,
    39,
    58,
    90,
    58,
    52
  ],
  "active": [
    1508,
    1439,
    934,
    1170,
    1392,
    1980,
    2771,
    1900,
    1688,
    1732,
    1152,
    1077,
    1765,
    1590,
    1683,
    1897,
    1752,
    1965,
    1496,
    1636,
    1783,
    976,
    1326,
    1731,
    1662,
    2030,
    2561,
    1939,
    1432,
    1017
  ],
  "apps": [
    {
      "app": "Tournament",
      "ic": "bracket",
      "d": "731",
      "w": "2’250",
      "m": "4’980",
      "spark": [
        22,
        21,
        18,
        6,
        11,
        22,
        25,
        26,
        24,
        23,
        24,
        11,
        20,
        21,
        7,
        19,
        22,
        23,
        29,
        35,
        26,
        13,
        5,
        12,
        18,
        19,
        55,
        47,
        18,
        18
      ]
    },
    {
      "app": "Casino",
      "ic": "chip",
      "d": "842",
      "w": "2’910",
      "m": "5’204",
      "spark": [
        11,
        15,
        23,
        22,
        28,
        29,
        20,
        19,
        13,
        11,
        19,
        18,
        27,
        32,
        22,
        22,
        17,
        10,
        16,
        17,
        21,
        28,
        24,
        25,
        23,
        13,
        16,
        15,
        13,
        24
      ]
    },
    {
      "app": "Wishlist",
      "ic": "gift",
      "d": "333",
      "w": "1’402",
      "m": "3’615",
      "spark": [
        22,
        20,
        20,
        19,
        11,
        14,
        13,
        10,
        18,
        19,
        20,
        23,
        19,
        16,
        12,
        8,
        13,
        17,
        17,
        28,
        23,
        16,
        16,
        9,
        10,
        14,
        16,
        25,
        21,
        18
      ]
    }
  ],
  "services": [
    {
      "id": "auth",
      "n": "Account",
      "host": "auth.planary.ch",
      "st": "ok",
      "ms": 84,
      "up": "99.98%",
      "dep": "18.10. 11:02",
      "commit": "c41a9e0",
      "by": "Mykyta P.",
      "errs": "0",
      "spark": [
        79,
        61,
        71,
        87,
        86,
        105,
        102,
        87,
        89,
        68,
        64,
        78,
        75,
        95,
        105,
        93,
        98,
        81,
        65,
        74,
        67,
        80,
        100,
        94,
        103,
        96,
        74,
        77,
        66,
        67,
        90,
        89,
        101,
        107,
        85,
        84,
        73,
        60,
        79,
        80
      ]
    },
    {
      "id": "tournament",
      "n": "Tournament",
      "host": "tournament.planary.ch",
      "st": "ok",
      "ms": 132,
      "up": "99.91%",
      "dep": "20.10. 19:54",
      "commit": "4f1e2a9",
      "by": "Lea Graf",
      "errs": "3",
      "spark": [
        122,
        155,
        148,
        159,
        156,
        122,
        124,
        112,
        105,
        138,
        140,
        153,
        168,
        139,
        135,
        123,
        100,
        122,
        129,
        137,
        167,
        152,
        146,
        141,
        107,
        114,
        119,
        119,
        154,
        155,
        151,
        158,
        124,
        116,
        118,
        105,
        135,
        149,
        148,
        167
      ]
    },
    {
      "id": "casino",
      "n": "Casino",
      "host": "casino.planary.ch",
      "st": "ok",
      "ms": 97,
      "up": "99.95%",
      "dep": "16.10. 08:40",
      "commit": "50c64e7",
      "by": "Mykyta P.",
      "errs": "1",
      "spark": [
        112,
        106,
        106,
        86,
        86,
        91,
        88,
        108,
        112,
        108,
        114,
        97,
        88,
        91,
        82,
        96,
        108,
        106,
        118,
        108,
        95,
        96,
        82,
        86,
        100,
        99,
        114,
        116,
        102,
        104,
        89,
        82,
        94,
        91,
        104,
        117,
        107,
        111,
        101,
        85
      ]
    },
    {
      "id": "wishlist",
      "n": "Wishlist",
      "host": "wishlist.planary.ch",
      "st": "ok",
      "ms": 71,
      "up": "100%",
      "dep": "19.10. 07:45",
      "commit": "a77d013",
      "by": "Mykyta P.",
      "errs": "0",
      "spark": [
        76,
        77,
        59,
        59,
        70,
        68,
        85,
        91,
        81,
        85,
        70,
        59,
        67,
        61,
        73,
        88,
        82,
        90,
        82,
        65,
        68,
        59,
        62,
        80,
        78,
        89,
        91,
        74,
        74,
        63,
        56,
        71,
        71,
        81,
        94,
        81,
        81,
        73,
        56,
        65
      ]
    },
    {
      "id": "web",
      "n": "planary.ch",
      "host": "planary.ch",
      "st": "ok",
      "ms": 38,
      "up": "100%",
      "dep": "20.10. 18:12",
      "commit": "b2fa536",
      "by": "Mykyta P.",
      "errs": "0",
      "spark": [
        38,
        32,
        32,
        39,
        39,
        45,
        49,
        42,
        42,
        36,
        30,
        36,
        35,
        40,
        48,
        44,
        45,
        42,
        33,
        35,
        33,
        34,
        44,
        43,
        46,
        47,
        37,
        37,
        34,
        30,
        39,
        41,
        44,
        49,
        42,
        40,
        38,
        30,
        35,
        38
      ]
    }
  ],
  "incidents": [
    {
      "id": "INC-0041",
      "t": "Wishlist: link previews slow",
      "st": "Resolved",
      "when": "14.10. 21:10",
      "dur": "38 min"
    },
    {
      "id": "INC-0040",
      "t": "Account: sign-in emails delayed",
      "st": "Resolved",
      "when": "02.10. 08:31",
      "dur": "1 h 12 min"
    }
  ],
  "errors": [
    {
      "t": "503 Upstream timeout",
      "p": "GET /api/live/:id",
      "n": "412",
      "w": "in 10 min"
    },
    {
      "t": "Database pool exhausted",
      "p": "worker: schedule-sync",
      "n": "96",
      "w": "in 10 min"
    },
    {
      "t": "WebSocket closed (1011)",
      "p": "beamer stream",
      "n": "57",
      "w": "in 10 min"
    }
  ],
  "support": [
    {
      "id": "REQ-1184",
      "s": "Beamer-Ansicht zeigt alte Resultate",
      "org": "Verein Gurten LAN",
      "who": "Matteo Keller",
      "app": "Tournament",
      "st": "open",
      "t": "20:02",
      "as": "MP",
      "unread": true,
      "urgent": true
    },
    {
      "id": "REQ-1183",
      "s": "Rechnung auf Verein statt Privatperson",
      "org": "FC Länggasse Esports",
      "who": "Sara Bühler",
      "app": "Billing",
      "st": "open",
      "t": "17:40",
      "as": "",
      "unread": true
    },
    {
      "id": "REQ-1182",
      "s": "Team kann sich nicht anmelden",
      "org": "Schule Kirchenfeld",
      "who": "Daniel Moser",
      "app": "Tournament",
      "st": "open",
      "t": "16:12",
      "as": "SH"
    },
    {
      "id": "REQ-1181",
      "s": "Logo erscheint verpixelt",
      "org": "Bümpliz Gaming",
      "who": "Kevin Marti",
      "app": "Tournament",
      "st": "open",
      "t": "gestern",
      "as": "SH"
    },
    {
      "id": "REQ-1179",
      "s": "Zwei Organisatoren zusätzlich",
      "org": "Aare Esports Club",
      "who": "Nina Frey",
      "app": "Plan",
      "st": "open",
      "t": "gestern",
      "as": ""
    },
    {
      "id": "REQ-1176",
      "s": "Export als PDF leer",
      "org": "Jugendtreff Wankdorf",
      "who": "Luca Steiner",
      "app": "Tournament",
      "st": "open",
      "t": "18.10.",
      "as": "LG"
    },
    {
      "id": "REQ-1174",
      "s": "Gruppen nachträglich ändern",
      "org": "Verein Gurten LAN",
      "who": "Noa Brunner",
      "app": "Tournament",
      "st": "waiting",
      "t": "17.10.",
      "as": "MP"
    }
  ],
  "thread": [
    {
      "who": "Matteo Keller",
      "ini": "MK",
      "kind": "them",
      "t": "20:02",
      "b": [
        "Hallo, seit etwa 19:55 zeigt die Beamer-Ansicht beim Gurten LAN noch das Resultat vom Viertelfinal. Wir haben das Halbfinal 2 schon eingetragen, im Handy ist es auch richtig.",
        "Neu laden hilft nicht. Das Final startet um 21:00, es wäre super, wenn es bis dann wieder geht."
      ],
      "att": "beamer-foto.jpg"
    },
    {
      "who": "Mykyta Pantelei",
      "ini": "MP",
      "kind": "int",
      "t": "20:05",
      "b": [
        "Hängt mit INC-0042 zusammen (Live-API). Lea rollt den Deploy von 19:54 zurück."
      ]
    },
    {
      "who": "Mykyta Pantelei",
      "ini": "MP",
      "kind": "us",
      "t": "20:06",
      "b": [
        "Hallo Matteo, danke für die schnelle Meldung. Das liegt an einer Störung bei uns, nicht an eurem Turnier. Wir sind dran und melden uns spätestens um 20:30.",
        "Eure Resultate sind gespeichert, es geht nichts verloren."
      ]
    }
  ],
  "audit": [
    {
      "t": "20.10. 20:09",
      "who": "Mykyta P.",
      "a": "Posted an incident update",
      "tg": "INC-0042",
      "d": "status: identified"
    },
    {
      "t": "20.10. 20:06",
      "who": "Mykyta P.",
      "a": "Replied to a support request",
      "tg": "REQ-1184",
      "d": "set to waiting"
    },
    {
      "t": "20.10. 20:04",
      "who": "Lea Graf",
      "a": "Rolled back a deploy",
      "tg": "Tournament",
      "d": "4f1e2a9 → 9b03c11"
    },
    {
      "t": "20.10. 19:40",
      "who": "Lea Graf",
      "a": "Sent a payment reminder",
      "tg": "Invoice 2026-0142",
      "d": "Verein Gurten LAN, 2nd reminder"
    },
    {
      "t": "20.10. 17:55",
      "who": "Sven Huber",
      "a": "Muted a player in chat",
      "tg": "Casino · player 81f2",
      "d": "24 h"
    },
    {
      "t": "20.10. 15:02",
      "who": "Lea Graf",
      "a": "Changed a plan",
      "tg": "Bümpliz Gaming",
      "d": "Gratis → Plus"
    },
    {
      "t": "20.10. 11:30",
      "who": "Mykyta P.",
      "a": "Changed a role",
      "tg": "Tim Roth",
      "d": "support → viewer"
    },
    {
      "t": "19.10. 22:14",
      "who": "Sven Huber",
      "a": "Added a customer note",
      "tg": "Schule Kirchenfeld",
      "d": "note 2"
    },
    {
      "t": "19.10. 16:48",
      "who": "Mykyta P.",
      "a": "Adjusted chips",
      "tg": "Casino · player 2c09",
      "d": "+5’000, refund"
    },
    {
      "t": "19.10. 09:03",
      "who": "Lea Graf",
      "a": "Disabled a share link",
      "tg": "Wishlist · link 7Qm3",
      "d": "reported, no reservations shown"
    }
  ],
  "staff": [
    {
      "n": "Mykyta Pantelei",
      "ini": "MP",
      "e": "mykyta@planary.ch",
      "role": "Owner",
      "last": "now"
    },
    {
      "n": "Lea Graf",
      "ini": "LG",
      "e": "lea@planary.ch",
      "role": "Manager",
      "last": "5 min ago"
    },
    {
      "n": "Sven Huber",
      "ini": "SH",
      "e": "sven@planary.ch",
      "role": "Support",
      "last": "2 h ago"
    },
    {
      "n": "Tim Roth",
      "ini": "TR",
      "e": "tim@planary.ch",
      "role": "Viewer",
      "last": "yesterday"
    }
  ],
  "customers": [
    {
      "id": "gurten",
      "n": "Verein Gurten LAN",
      "ini": "GL",
      "lc": "",
      "plan": "Plus",
      "mem": "3",
      "tour": "7",
      "rev": "149",
      "st": "overdue",
      "stl": "Overdue 12 days",
      "since": "03.02.2026"
    },
    {
      "id": "fcl",
      "n": "FC Länggasse Esports",
      "ini": "FL",
      "lc": "l2",
      "plan": "Plus",
      "mem": "5",
      "tour": "11",
      "rev": "149",
      "st": "ok",
      "stl": "Paid",
      "since": "12.01.2026"
    },
    {
      "id": "kf",
      "n": "Schule Kirchenfeld",
      "ini": "SK",
      "lc": "l3",
      "plan": "Gratis",
      "mem": "2",
      "tour": "2",
      "rev": "58",
      "st": "ok",
      "stl": "Paid",
      "since": "28.08.2026"
    },
    {
      "id": "aare",
      "n": "Aare Esports Club",
      "ini": "AE",
      "lc": "",
      "plan": "Plus",
      "mem": "4",
      "tour": "9",
      "rev": "149",
      "st": "ok",
      "stl": "Paid",
      "since": "05.03.2026"
    },
    {
      "id": "bg",
      "n": "Bümpliz Gaming",
      "ini": "BG",
      "lc": "l2",
      "plan": "Gratis",
      "mem": "1",
      "tour": "1",
      "rev": "29",
      "st": "ok",
      "stl": "Paid",
      "since": "30.09.2026"
    },
    {
      "id": "jw",
      "n": "Jugendtreff Wankdorf",
      "ini": "JW",
      "lc": "l3",
      "plan": "Gratis",
      "mem": "2",
      "tour": "4",
      "rev": "0",
      "st": "free",
      "stl": "Free",
      "since": "14.06.2026"
    },
    {
      "id": "tt",
      "n": "TTC Ostermundigen",
      "ini": "TO",
      "lc": "",
      "plan": "Gratis",
      "mem": "1",
      "tour": "3",
      "rev": "0",
      "st": "free",
      "stl": "Free",
      "since": "02.09.2026"
    },
    {
      "id": "ub",
      "n": "Uni Bern Gaming",
      "ini": "UB",
      "lc": "l2",
      "plan": "Plus",
      "mem": "6",
      "tour": "5",
      "rev": "149",
      "st": "warn",
      "stl": "Card expires 11/26",
      "since": "21.04.2026"
    }
  ],
  "tournaments": [
    {
      "n": "Gurten LAN",
      "org": "Verein Gurten LAN",
      "g": "Counter-Strike 2",
      "teams": "16 / 16",
      "plan": "Plus",
      "st": "live",
      "d": "Today"
    },
    {
      "n": "Herbstcup Valorant",
      "org": "FC Länggasse Esports",
      "g": "Valorant",
      "teams": "24 / 32",
      "plan": "Plus",
      "st": "live",
      "d": "Today"
    },
    {
      "n": "Pausenplatz-Turnier",
      "org": "Schule Kirchenfeld",
      "g": "Rocket League",
      "teams": "12 / 16",
      "plan": "Gratis",
      "st": "live",
      "d": "Today"
    },
    {
      "n": "Aare Open",
      "org": "Aare Esports Club",
      "g": "League of Legends",
      "teams": "18 / 32",
      "plan": "Plus",
      "st": "open",
      "d": "31.10."
    },
    {
      "n": "Winter-LAN",
      "org": "Verein Gurten LAN",
      "g": "Counter-Strike 2",
      "teams": "4 / 32",
      "plan": "Plus",
      "st": "open",
      "d": "13.12."
    },
    {
      "n": "Pingpong Nacht",
      "org": "TTC Ostermundigen",
      "g": "Table Tennis",
      "teams": "9 / 16",
      "plan": "Gratis",
      "st": "open",
      "d": "07.11."
    },
    {
      "n": "Mario Kart Cup",
      "org": "Jugendtreff Wankdorf",
      "g": "Mario Kart 8",
      "teams": "–",
      "plan": "Gratis",
      "st": "draft",
      "d": "–"
    },
    {
      "n": "Sommer-LAN",
      "org": "Verein Gurten LAN",
      "g": "Counter-Strike 2",
      "teams": "16 / 16",
      "plan": "Gratis",
      "st": "done",
      "d": "09.08."
    }
  ],
  "live": [
    {
      "n": "Gurten LAN",
      "org": "Verein Gurten LAN",
      "g": "Counter-Strike 2",
      "ph": "Semifinals",
      "teams": "16 teams",
      "since": "10:00",
      "viewers": "142",
      "alert": true
    },
    {
      "n": "Herbstcup Valorant",
      "org": "FC Länggasse Esports",
      "g": "Valorant",
      "ph": "Groups, round 3",
      "teams": "24 teams",
      "since": "14:00",
      "viewers": "61"
    },
    {
      "n": "Pausenplatz-Turnier",
      "org": "Schule Kirchenfeld",
      "g": "Rocket League",
      "ph": "Quarterfinals",
      "teams": "12 teams",
      "since": "18:30",
      "viewers": "38"
    }
  ],
  "organisers": [
    {
      "n": "Verein Gurten LAN",
      "ini": "GL",
      "lc": "",
      "plan": "Plus",
      "orgs": "3",
      "tour": "7",
      "last": "Gurten LAN · today",
      "st": "overdue",
      "stl": "Overdue"
    },
    {
      "n": "FC Länggasse Esports",
      "ini": "FL",
      "lc": "l2",
      "plan": "Plus",
      "orgs": "5",
      "tour": "11",
      "last": "Herbstcup Valorant · today",
      "st": "ok",
      "stl": "Active"
    },
    {
      "n": "Aare Esports Club",
      "ini": "AE",
      "lc": "",
      "plan": "Plus",
      "orgs": "4",
      "tour": "9",
      "last": "Aare Open · 31.10.",
      "st": "ok",
      "stl": "Active"
    },
    {
      "n": "Schule Kirchenfeld",
      "ini": "SK",
      "lc": "l3",
      "plan": "Gratis",
      "orgs": "2",
      "tour": "2",
      "last": "Pausenplatz-Turnier · today",
      "st": "ok",
      "stl": "Active"
    },
    {
      "n": "Jugendtreff Wankdorf",
      "ini": "JW",
      "lc": "l3",
      "plan": "Gratis",
      "orgs": "2",
      "tour": "4",
      "last": "Mario Kart Cup · draft",
      "st": "free",
      "stl": "Free"
    },
    {
      "n": "Noa Brunner",
      "ini": "NB",
      "lc": "l2",
      "plan": "Gratis",
      "orgs": "1",
      "tour": "2",
      "last": "Freitagsrunde · 16.10.",
      "st": "free",
      "stl": "Free, no organisation"
    }
  ],
  "casinoKpis": [
    {
      "l": "Players online",
      "v": "214",
      "s": "5’204 registered"
    },
    {
      "l": "New players",
      "v": "38",
      "s": "212 in 7 days"
    },
    {
      "l": "Wagered today",
      "v": "1’482’300",
      "s": "642 players, 18’240 bets"
    },
    {
      "l": "House result today",
      "v": "+61’940",
      "s": "RTP 95.8%",
      "up": true
    }
  ],
  "casinoBars": [
    38,
    37,
    65,
    65,
    77,
    87,
    61,
    59,
    47,
    30,
    51,
    55,
    65,
    88,
    73,
    69,
    62,
    34,
    43,
    46,
    49,
    79,
    77,
    75,
    78,
    47,
    44,
    44,
    35,
    63
  ],
  "games": [
    {
      "g": "Blackjack",
      "w": "612’400",
      "r": "+21’300",
      "rtp": "96.5%",
      "exp": "99.4%"
    },
    {
      "g": "Roulette",
      "w": "388’100",
      "r": "+14’020",
      "rtp": "96.4%",
      "exp": "97.3%"
    },
    {
      "g": "Slots",
      "w": "301’700",
      "r": "+19’880",
      "rtp": "93.4%",
      "exp": "95.0%"
    },
    {
      "g": "Hold’em poker",
      "w": "112’600",
      "r": "+3’380",
      "rtp": "rake",
      "exp": "rake"
    },
    {
      "g": "Grimoire",
      "w": "41’200",
      "r": "+2’110",
      "rtp": "94.9%",
      "exp": "95.0%"
    },
    {
      "g": "Nerve",
      "w": "26’300",
      "r": "+1’250",
      "rtp": "95.2%",
      "exp": "96.0%"
    }
  ],
  "casinoTabs": [
    "Overview",
    "Games",
    "Game rounds",
    "Transactions",
    "Players",
    "Moderation",
    "Announcements",
    "Bank",
    "Economy and market"
  ],
  "wishKpis": [
    {
      "l": "Lists",
      "v": "9’812",
      "s": "+214 this week"
    },
    {
      "l": "Items saved",
      "v": "61’204",
      "s": "6.2 per list"
    },
    {
      "l": "Shared lists",
      "v": "3’140",
      "s": "32% of all lists"
    },
    {
      "l": "Reservations this month",
      "v": "2’231",
      "s": "a count, nothing more"
    }
  ],
  "wishBars": [
    226,
    233,
    222,
    238,
    172,
    150,
    159,
    130,
    186,
    219,
    214,
    255
  ],
  "shops": [
    [
      "galaxus.ch",
      22
    ],
    [
      "digitec.ch",
      15
    ],
    [
      "zalando.ch",
      11
    ],
    [
      "manor.ch",
      8
    ],
    [
      "ikea.ch",
      6
    ],
    [
      "Other shops",
      38
    ]
  ],
  "gurten": {
    "n": "Verein Gurten LAN",
    "ini": "GL",
    "id": "org_8f2k1",
    "since": "03.02.2026",
    "plan": "Plus",
    "price": "CHF 149 a year, one invoice",
    "renews": "03.02.2027",
    "pay": "Visa •••• 4242, expires 08/28",
    "prov": "Stripe",
    "contact": "matteo.keller@gurtenlan.ch",
    "invoices": [
      {
        "n": "2026-0142",
        "d": "24.09.2026",
        "a": "CHF 149.00",
        "st": "err",
        "stl": "Overdue 12 days"
      },
      {
        "n": "2026-0031",
        "d": "03.02.2026",
        "a": "CHF 29.00",
        "st": "ok",
        "stl": "Paid"
      }
    ],
    "members": [
      {
        "n": "Matteo Keller",
        "ini": "MK",
        "r": "Owner",
        "last": "today"
      },
      {
        "n": "Noa Brunner",
        "ini": "NB",
        "r": "Member",
        "last": "today"
      },
      {
        "n": "Céline Favre",
        "ini": "CF",
        "r": "Member",
        "last": "12.10."
      }
    ],
    "tours": [
      {
        "n": "Gurten LAN",
        "d": "Today",
        "st": "live",
        "stl": "Live"
      },
      {
        "n": "Winter-LAN",
        "d": "13.12.",
        "st": "open",
        "stl": "Sign-up open"
      },
      {
        "n": "Sommer-LAN",
        "d": "09.08.",
        "st": "done",
        "stl": "Finished"
      }
    ],
    "notes": [
      {
        "who": "Lea Graf",
        "t": "20.10. 19:41",
        "b": "Moved from Gratis with passes to Plus in September, they run about one tournament a month. Invoice 2026-0142 is overdue; Matteo says the club treasurer pays on the 25th. Keep the plan until 03.11."
      },
      {
        "who": "Sven Huber",
        "t": "02.09. 10:15",
        "b": "Asked for the logo on the beamer to be bigger. Passed on as feedback, no promise."
      }
    ],
    "reqs": [
      {
        "id": "REQ-1184",
        "s": "Beamer-Ansicht zeigt alte Resultate",
        "st": "open",
        "stl": "Open"
      },
      {
        "id": "REQ-1174",
        "s": "Gruppen nachträglich ändern",
        "st": "waiting",
        "stl": "Waiting"
      }
    ]
  }
} as const;
