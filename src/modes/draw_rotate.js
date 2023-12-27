import distance from '@turf/distance';
import centroid from '@turf/centroid';
import bearing from '@turf/bearing'
import destination from '@turf/destination'
// import { EventEmitter } from "events";

// const emitter = new EventEmitter();

const RotateMode = {

    rotatestart: function(selectedFeature,originalCenter) {},
    rotating: function(selectedFeature,originalCenter,lastMouseDown) {},
    rotateend: function(selectedFeature) {},

    onSetup: function(opts) {
        const state = {};

        // emitter.addListener('rotatestart',function() {
        //     this.rotatestart(state.selectedFeature,state.originalCenter)
        // }.bind(this));
        // emitter.addListener('rotating', function() {
        //     this.rotating(state.selectedFeature,state.originalCenter,state.lastMouseDownLngLat)
        // }.bind(this));
        // emitter.addListener('rotateend', function() {
        //     this.rotateend(state.selectedFeature,state.lastMouseDownLngLat)
        // }.bind(this));

        state.selectedFeature = opts.selectedFeature || false;
        state.lastMouseDownLngLat = false;
        state.originalCenter = false;
        state.mode = 'rotate' || false;
        return state;
    },

    onMouseDown: function(state, e) {
        if(e.featureTarget) {
            if(this._ctx.api.get(e.featureTarget.properties.id)) {
                e.target['dragPan'].disable();
                state.selectedFeature = this._ctx.api.get(e.featureTarget.properties.id);
                state.originalCenter = centroid(e.featureTarget);
                state.originalFeature = e.featureTarget;
                // emitter.emit('rotatestart');
            }
        }
        return state;
    },

    toDisplayFeatures: function(state, geojson, display) {
        display(geojson);
    },

    onDrag: function(state, e) {
        if(state.selectedFeature&&state.mode) {
            if(state.mode==='rotate') {
                state.lastMouseDownLngLat = {lng:e.lngLat.lng, lat: e.lngLat.lat};
                const draggedBearing = bearing(state.originalCenter, [e.lngLat.lng, e.lngLat.lat]);
                let rotatedCoords = [];
                switch (state.originalFeature.properties['meta:type']) {
                    case 'Point':
                        break;
                    case 'LineString':
                        state.originalFeature.geometry.coordinates.forEach(function(coords,index) {
                            const distanceFromCenter = distance(state.originalCenter, coords);
                            const bearingFromCenter = bearing(state.originalCenter, coords);
                            const newPoint = destination(state.originalCenter, distanceFromCenter, bearingFromCenter + draggedBearing);
                            rotatedCoords.push(newPoint.geometry.coordinates);
                        })
                        break;
                    case 'Polygon':
                        const polyCoords = [];
                        state.originalFeature.geometry.coordinates[0].forEach(function(coords,index) {
                            const distanceFromCenter = distance(state.originalCenter, coords);
                            const bearingFromCenter = bearing(state.originalCenter, coords);
                            const newPoint = destination(state.originalCenter, distanceFromCenter, bearingFromCenter + draggedBearing);
                            polyCoords.push(newPoint.geometry.coordinates);
                        })
                        rotatedCoords.push(polyCoords);
                        break;
                    case 'MultiLineString':
                        var multipolys = [];
                        state.originalFeature.geometry.coordinates.forEach(function(polygon,index) {
                            const polyCoords = [];
                            polygon.forEach(function(coords,index) {
                                const distanceFromCenter = distance(state.originalCenter, coords);
                                const bearingFromCenter = bearing(state.originalCenter, coords);
                                const newPoint = destination(state.originalCenter, distanceFromCenter, bearingFromCenter + draggedBearing);
                                polyCoords.push(newPoint.geometry.coordinates);
                            })
                            multipolys.push(polyCoords);
                        })
                        rotatedCoords = multipolys;
                        break;
                    case 'MultiPolygon':
                        var multipolys = [];
                        state.originalFeature.geometry.coordinates.forEach(function(polygon,index) {
                            const polyCoords = [];
                            polygon.forEach(function(polygonHoles,index) {
                                const polyHoleCoords = [];
                                polygonHoles.forEach(function(coords,index) {
                                    const distanceFromCenter = distance(state.originalCenter, coords);
                                    const bearingFromCenter = bearing(state.originalCenter, coords);
                                    const newPoint = destination(state.originalCenter, distanceFromCenter, bearingFromCenter + draggedBearing);
                                    polyHoleCoords.push(newPoint.geometry.coordinates);
                                });
                                polyCoords.push(polyHoleCoords);
                            })
                            multipolys.push(polyCoords);
                        })
                        rotatedCoords = multipolys;
                        break;
                    default:
                        return;
                }
               //  emitter.emit('rotating');
                const newFeature = state.selectedFeature;
                newFeature.geometry.coordinates = rotatedCoords;
                const thisFeat = this._ctx.api.add(newFeature);
            }
        }
    },

    onMouseUp: function(state, e) {
        e.target['dragPan'].enable();
        // emitter.emit('rotateend');
        state.selectedFeature = false;
        state.lastMouseDownLngLat = false;
        state.originalCenter = false;
        return state;
    }
}

export default RotateMode;
