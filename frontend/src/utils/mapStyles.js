/**
 * Google Maps styling themes for CrisisGrid Live
 * Premium Dark Theme with vibrant blue oceans, distinct continental contours, and natural park vegetation.
 */

export const darkMapStyle = [
  // Base Landmass & Geometry
  {
    elementType: 'geometry',
    stylers: [{ color: '#1e293b' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0f172a' }, { weight: 2.5 }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },

  // Country & State Borders
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#64748b' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f8fafc' }, { weight: 'bold' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#475569' }, { weight: 0.8 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }],
  },

  // Parks, Nature & Vegetation (Deep Forest Green, Not Black)
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#143026' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4ade80' }],
  },

  // Roads & Highways (Clear Navigation Grid)
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#273549' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#192333' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3b4e6b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1e293b' }, { weight: 1.5 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f1f5f9' }],
  },

  // Transit
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#243247' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },

  // Oceans, Seas, Lakes & Rivers (Rich Oceanic Blue, NOT Pitch Black)
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#162b45' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#142842' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0b1624' }, { weight: 2 }],
  },
];

