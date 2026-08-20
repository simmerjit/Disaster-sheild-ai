/**
 * Ultra-Luxurious Pure Black & Charcoal Minimalist Map Style
 * Inspired by Apple Dark Mode, Uber Black & Linear.
 */

export const darkMapStyle = [
  // Base Landmass & Geometry
  {
    elementType: 'geometry',
    stylers: [{ color: '#090909' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }, { weight: 3 }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e8e93' }],
  },

  // Country & State Borders
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#27272a' }, { weight: 1 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }, { weight: 'bold' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1c1c1e' }, { weight: 0.7 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d8' }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#71717a' }],
  },

  // Points of Interest & Parks (Deep Matte Charcoal)
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#0f0f0f' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#0d0d0d' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#636366' }],
  },

  // Roads & Highways (Clean Dark Monochrome Grid)
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#141414' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0c0c0c' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#71717a' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1c1c1e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#121212' }, { weight: 1.2 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e4e4e7' }],
  },

  // Transit
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#121212' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e8e93' }],
  },

  // Oceans, Seas, Lakes & Rivers (Deep Pure Black Surface)
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#000000' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#52525b' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#000000' }, { weight: 2 }],
  },
];
