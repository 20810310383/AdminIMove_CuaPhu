import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPoint, extractTripEndpoints, trackAsiaRouteUrl, routeProfile, parseTrackAsiaRoute } from './tripMapGeometry.js';
const a = [106.701,10.776];
const b = [106.752,10.812];
test('Backend GeoJSON pickup/destination', () => {
 const result = extractTripEndpoints({ pickup:{address:'Quận 1',location:{type:'Point',coordinates:a}}, destination:{address:'Thủ Đức',location:{type:'Point',coordinates:b}} });
 assert.deepEqual(result, {pickup:{lat:10.776,lon:106.701},destination:{lat:10.812,lon:106.752}});
});
test('numeric lat/lon and explicit coordinate string are supported',()=>{
 assert.deepEqual(extractPoint({latitude:'10.776',longitude:'106.701'}), {lat:10.776,lon:106.701});
 assert.deepEqual(extractPoint('10.776,106.701'), {lat:10.776,lon:106.701});
});
test('normal address and null location never invent coordinates', () => {
 assert.equal(extractPoint('Đường số 8, Bình Tân'), null);
 assert.equal(extractPoint({latitude:null,longitude:null}), null);
 assert.deepEqual(extractTripEndpoints({pickup:{address:'Quận 1'},destination:{address:'Bình Tân'}}), {pickup:null,destination:null});
});
test('motorbike profile and TrackAsia v1 URL ordering [lon,lat]', () => {
 assert.equal(routeProfile('BIKE'),'moto'); assert.equal(routeProfile('CAR_7'),'car');
 const url = new URL(trackAsiaRouteUrl({pickup:extractPoint(a),destination:extractPoint(b),serviceCode:'BIKE',apiBaseUrl:'https://maps.track-asia.com',apiKey:'test-key'}));
 assert.match(url.pathname,/\/route\/v1\/moto\/106\.701,10\.776;106\.752,10\.812\.json/);
 assert.equal(url.searchParams.get('geometries'),'geojson');
});
test('route geometry is validated (not fabricated as straight line)',()=>{
 assert.deepEqual(parseTrackAsiaRoute({code:'Ok',routes:[{geometry:{type:'LineString',coordinates:[a,b]},distance:1500,duration:300}]}).distanceKm,1.5);
 assert.throws(()=>parseTrackAsiaRoute({routes:[]}),/không trả về/);
});
