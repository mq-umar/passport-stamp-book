// Fallback copy of data.json for file:// use. A unit test keeps the two identical.
var PERSONAS={
 "maya": {
  "name": "Maya (Weekend Explorer)",
  "tx": [
   {
    "id": 1,
    "d": "2026-10-09",
    "m": "Hot Chicken Co",
    "city": "Nashville",
    "st": "TN",
    "cat": "dining",
    "cuisine": "Southern",
    "amt": 34,
    "status": "posted",
    "miles": 470
   },
   {
    "id": 2,
    "d": "2026-10-09",
    "m": "Smokehouse 51",
    "city": "Nashville",
    "st": "TN",
    "cat": "dining",
    "cuisine": "Barbecue",
    "amt": 48,
    "status": "posted",
    "miles": 470
   },
   {
    "id": 3,
    "d": "2026-10-10",
    "m": "Biscuit Cafe",
    "city": "Nashville",
    "st": "TN",
    "cat": "dining",
    "cuisine": "Southern",
    "amt": 22,
    "status": "posted",
    "miles": 470
   },
   {
    "id": 4,
    "d": "2026-10-11",
    "m": "Pending Taxi",
    "city": "Nashville",
    "st": "TN",
    "cat": "transport",
    "amt": 30,
    "status": "pending",
    "miles": 470
   },
   {
    "id": 5,
    "d": "2026-10-02",
    "m": "Corner Diner",
    "city": "Chicago",
    "st": "IL",
    "cat": "dining",
    "cuisine": "American",
    "amt": 18,
    "status": "posted",
    "miles": 2
   }
  ],
  "holder": "Maya",
  "role": "Weekend Explorer",
  "docNo": "0417"
 },
 "daniel": {
  "name": "Daniel (Urban Foodie)",
  "tx": [
   {
    "id": 1,
    "d": "2026-11-01",
    "m": "Ramen House",
    "city": "New York",
    "st": "NY",
    "cat": "dining",
    "cuisine": "Japanese",
    "amt": 28,
    "status": "posted",
    "miles": 790
   },
   {
    "id": 2,
    "d": "2026-11-02",
    "m": "Injera Place",
    "city": "New York",
    "st": "NY",
    "cat": "dining",
    "cuisine": "Ethiopian",
    "amt": 36,
    "status": "posted",
    "miles": 790
   },
   {
    "id": 3,
    "d": "2026-11-03",
    "m": "Taqueria Sol",
    "city": "New York",
    "st": "NY",
    "cat": "dining",
    "cuisine": "Mexican",
    "amt": 3,
    "status": "posted",
    "miles": 790
   },
   {
    "id": 4,
    "d": "2026-11-04",
    "m": "Unknown Cafe",
    "city": "New York",
    "st": "NY",
    "cat": "dining",
    "cuisine": null,
    "amt": 15,
    "status": "posted",
    "miles": 790
   }
  ],
  "holder": "Daniel",
  "role": "Urban Foodie",
  "docNo": "0233"
 },
 "priya": {
  "name": "Priya (Aspirational Traveler)",
  "tx": [
   {
    "id": 1,
    "d": "2026-06-12",
    "m": "Cafe de Flore",
    "city": "Paris",
    "st": "FR",
    "cat": "dining",
    "cuisine": "French",
    "amt": 40,
    "status": "posted",
    "miles": 4100,
    "intl": true
   },
   {
    "id": 2,
    "d": "2026-06-13",
    "m": "Louvre Shop",
    "city": "Paris",
    "st": "FR",
    "cat": "retail",
    "amt": 25,
    "status": "posted",
    "miles": 4100,
    "intl": true
   }
  ],
  "holder": "Priya",
  "role": "Aspirational Traveler",
  "docNo": "0861"
 }
};
if(typeof module!=="undefined"&&module.exports)module.exports=PERSONAS;
