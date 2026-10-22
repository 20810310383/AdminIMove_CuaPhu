import React from 'react';
import { Crosshair, MapPin, Route } from 'lucide-react';
import { getTrackAsiaGL, getTrackAsiaStyleUrl, trackAsiaConfig, usesTrackAsiaPublicTestKey } from './trackAsiaConfig.js';
import { extractTripEndpoints, parseTrackAsiaRoute, trackAsiaRouteUrl } from './tripMapGeometry.js';

const ROUTE_SOURCE = 'imove-trip-route';
const ROUTE_LINE = 'imove-trip-route-line';
const ROUTE_HALO = 'imove-trip-route-halo';

function fitMapToPoints(map, coords, animate = true) {
  if (!map || !coords.length) return;
  if (coords.length === 1) {
    map.easeTo({ center: coords[0], zoom: 14, duration: animate ? 450 : 0 });
    return;
  }
  const lons = coords.map(([lon]) => lon);
  const lats = coords.map(([,lat]) => lat);
  map.fitBounds([[Math.min(...lons),Math.min(...lats)],[Math.max(...lons),Math.max(...lats)]], {
    padding: { top: 64, bottom: 64, left: 64, right: 64 },
    maxZoom: 15,
    duration: animate ? 450 : 0,
  });
}

function createMarkerElement(kind, label) {
  const el = document.createElement('div');
  el.className = `imove-trip-endpoint-marker ${kind}`;
  el.setAttribute('aria-label', label);
  const bubble = document.createElement('span');
  bubble.className = 'imove-trip-endpoint-dot';
  bubble.textContent = kind === 'pickup' ? 'A' : 'B';
  const text = document.createElement('span');
  text.className = 'imove-trip-endpoint-label';
  text.textContent = label;
  el.append(bubble, text);
  return el;
}

function drawRoute(map, geometry) {
  if (!map || !map.isStyleLoaded?.()) return;
  const data = { type:'Feature', properties:{}, geometry };
  if (map.getSource(ROUTE_SOURCE)) {
    map.getSource(ROUTE_SOURCE).setData(data);
    return;
  }
  map.addSource(ROUTE_SOURCE, { type:'geojson', data });
  map.addLayer({
    id:ROUTE_HALO, type:'line', source:ROUTE_SOURCE,
    layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{ 'line-color':'#ffffff', 'line-width':10, 'line-opacity':.96 },
  });
  map.addLayer({
    id:ROUTE_LINE, type:'line', source:ROUTE_SOURCE,
    layout:{ 'line-cap':'round', 'line-join':'round' },
    paint:{ 'line-color':'#ec2138', 'line-width':6, 'line-opacity':.95 },
  });
}

export default function TripOperationsMap({ trips = [] }) {
  const trip = trips[0] || null;
  const hostRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const markersRef = React.useRef([]);
  const [mapReady, setMapReady] = React.useState(false);
  const [mapError, setMapError] = React.useState('');
  const [routeError, setRouteError] = React.useState('');
  const [routeLoading, setRouteLoading] = React.useState(false);
  const [routeData, setRouteData] = React.useState(null);

  const endpoints = React.useMemo(() => {
    if (!trip) return { pickup: null, destination: null };
    return extractTripEndpoints(trip);
  }, [trip]);
  const availablePoints = React.useMemo(() =>
    [endpoints.pickup, endpoints.destination].filter(Boolean).map((p) => [p.lon, p.lat]),
  [endpoints]);
  const canRoute = Boolean(endpoints.pickup && endpoints.destination);
  const profile = trip?.serviceCode || trip?.serviceType || trip?.vehicleType || 'CAR';
  const routeKey = `${endpoints.pickup?.lat || ''},${endpoints.pickup?.lon || ''}|${endpoints.destination?.lat || ''},${endpoints.destination?.lon || ''}|${profile}`;

  React.useEffect(() => {
    const host = hostRef.current;
    const trackasiagl = getTrackAsiaGL();
    if (!host) return undefined;
    if (!trackasiagl) {
      setMapError('Không tải được thư viện TrackAsia GL JS. Kiểm tra CDN và kết nối mạng.');
      return undefined;
    }
    let map;
    let stillMounted = true;
    try {
      map = new trackasiagl.Map({
        container: host,
        style: getTrackAsiaStyleUrl(),
        center: [trackAsiaConfig.defaultCenter.lon, trackAsiaConfig.defaultCenter.lat],
        zoom: 11,
        minZoom: trackAsiaConfig.minZoom,
        maxZoom: trackAsiaConfig.maxZoom,
        attributionControl: true,
      });
      mapRef.current = map;
      if (trackasiagl.NavigationControl) map.addControl(new trackasiagl.NavigationControl({ showCompass:false }), 'top-left');
      if (trackasiagl.FullscreenControl) map.addControl(new trackasiagl.FullscreenControl(), 'top-right');
      map.scrollZoom?.enable?.();
      map.dragPan?.enable?.();
      map.touchZoomRotate?.enable?.();
      map.doubleClickZoom?.enable?.();
      map.on('load', () => {
        if (!stillMounted) return;
        map.resize();
        setMapReady(true);
        setMapError('');
      });
      map.on('error', (event) => {
        const message = String(event?.error?.message || '');
        if (stillMounted && /401|403|unauthorized|forbidden|style|failed to fetch/i.test(message)) {
          setMapError('TrackAsia không tải được lớp bản đồ. Hãy kiểm tra VITE_TRACKASIA_API_KEY, mạng và quyền sử dụng key.');
        }
      });
    } catch (error) {
      setMapError(`Không khởi tạo được bản đồ: ${error?.message || 'Lỗi không xác định'}`);
      return undefined;
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => map.resize());
    observer?.observe(host);
    const raf = requestAnimationFrame(() => map.resize());
    return () => {
      stillMounted = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      markersRef.current.forEach((marker) => marker.remove?.());
      markersRef.current = [];
      mapRef.current = null;
      map?.remove?.();
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    const trackasiagl = getTrackAsiaGL();
    if (!map || !trackasiagl || !mapReady) return;
    markersRef.current.forEach((marker) => marker.remove?.());
    markersRef.current = [];
    for (const [kind, point, name] of [
      ['pickup', endpoints.pickup, 'Điểm đón'],
      ['destination', endpoints.destination, 'Điểm đến'],
    ]) {
      if (!point) continue;
      markersRef.current.push(new trackasiagl.Marker({
        element: createMarkerElement(kind, name), anchor:'bottom',
      }).setLngLat([point.lon, point.lat]).addTo(map));
    }
    map.resize();
    fitMapToPoints(map, availablePoints, false);
  }, [mapReady, endpoints, availablePoints]);

  React.useEffect(() => {
    if (!canRoute) {
      setRouteData(null);
      setRouteError('');
      setRouteLoading(false);
      return undefined;
    }
    const url = trackAsiaRouteUrl({
      pickup:endpoints.pickup, destination:endpoints.destination, serviceCode:profile,
      apiBaseUrl:trackAsiaConfig.apiBaseUrl, apiKey:trackAsiaConfig.apiKey,
    });
    if (!url) {
      setRouteError('Chưa có cấu hình TrackAsia hợp lệ để tính tuyến đường.');
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 14000);
    setRouteLoading(true);
    setRouteError('');
    setRouteData(null);
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return parseTrackAsiaRoute(await response.json());
      })
      .then((result) => { if (active && !controller.signal.aborted) setRouteData(result); })
      .catch((error) => {
        if (!active) return;
        setRouteError(timedOut
          ? 'Định tuyến quá thời gian phản hồi.'
          : `Không lấy được tuyến TrackAsia (${error.message}). Kiểm tra key, CORS và dịch vụ định tuyến.`);
      })
      .finally(() => { clearTimeout(timeout); if (active) setRouteLoading(false); });
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  // routeKey captures the current booking endpoints and service profile.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, canRoute]);

  React.useEffect(() => {
    if (!mapReady || !routeData?.geometry) return;
    const map = mapRef.current;
    if (!map) return;
    try {
      drawRoute(map, routeData.geometry);
      map.resize();
      fitMapToPoints(map, routeData.geometry.coordinates, false);
    } catch (error) {
      setRouteError(`Không thể vẽ tuyến trên bản đồ: ${error.message}`);
    }
  }, [mapReady, routeData]);

  const resetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.resize();
    fitMapToPoints(map, routeData?.geometry?.coordinates || availablePoints);
  };
  return (
    <section className="trip-map-card" aria-labelledby="trip-map-title">
      <header className="trip-map-header">
        <div>
          <h2 id="trip-map-title">Bản đồ hành trình TrackAsia</h2>
          <p>Điểm đón A → điểm đến B · kéo, zoom và bấm định vị lại khung nhìn.</p>
        </div>
        <div className="trip-map-state">
          <span className="trip-map-count">{availablePoints.length}/2 điểm có tọa độ</span>
        </div>
      </header>
      <div className="trackasia-map-shell trip-map-expanded-shell">
        <div ref={hostRef} className="trackasia-trip-map trip-map-expanded-canvas" role="region" aria-label="Bản đồ hành trình và vị trí điểm đón, điểm đến" />
        <button className="trackasia-reset-control" type="button" onClick={resetView} aria-label="Định vị lại hành trình" title="Định vị lại hành trình"><Crosshair size={16}/></button>
        {mapError && <div className="trackasia-map-error" role="alert">{mapError}</div>}
        {!mapError && !availablePoints.length && <div className="trackasia-map-empty"><MapPin size={20}/><span>Chuyến không có tọa độ GPS hợp lệ.</span><small>Dữ liệu cũ chỉ lưu địa chỉ; không tự đoán vị trí.</small></div>}
        {usesTrackAsiaPublicTestKey() && <span className="trackasia-key-badge">TrackAsia test key</span>}
      </div>
      <div className="imove-trip-map-footer" aria-live="polite">
        {!endpoints.pickup && <span className="imove-map-warn">Thiếu tọa độ điểm đón</span>}
        {!endpoints.destination && <span className="imove-map-warn">Thiếu tọa độ điểm đến</span>}
        {routeLoading && <span><Route size={14}/> Đang tính tuyến đường thực tế...</span>}
        {routeData && !routeError && <span><Route size={14}/> Tuyến: {routeData.distanceKm?.toFixed(1) ?? '—'} km · {routeData.durationMinutes?.toFixed(0) ?? '—'} phút (ước tính)</span>}
        {routeError && <span className="imove-map-warn">{routeError}</span>}
        {!routeLoading && !routeError && !routeData && availablePoints.length === 1 && <span>Chỉ hiển thị được vị trí đã lưu, chưa đủ hai điểm để dẫn đường.</span>}
      </div>
    </section>
  );
}
