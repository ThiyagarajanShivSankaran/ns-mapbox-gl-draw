import { geojsonTypes, activeStates } from "../constants"; // Assume these are the only used constants
import bearing from "@turf/bearing";
import { lineString } from '@turf/helpers';
import calculateDistance from "./create_distance"; // Renamed for clarity and camelCase

/**
 *
 * @param parentId
 * @param currentVertexPosition
 * @param coordinates
 * @param isSelected
 * @param meta
 * @param units
 * @param showBearing
 * @returns {{}|{geometry: {coordinates: *, type: string}, type: string, properties: {parent, meta: string, active: (string)}}}
 */
export default function(parentId, currentVertexPosition, coordinates, isSelected, meta = 'arrowPosition', units = '', showBearing = true) {
    try {
        const additionalProps = {};
        if (units) {
            const distanceVertex = lineString([coordinates[currentVertexPosition - 1], coordinates[currentVertexPosition]]);
            const { metric, standard } = calculateDistance(distanceVertex);
            additionalProps.distance = units === 'metric' ? metric : standard;
        }

        if (showBearing) {
            const rotation = bearing(coordinates[currentVertexPosition - 1], coordinates[currentVertexPosition]);
            additionalProps.bearing = rotation || 0;
        }

        return {
            type: geojsonTypes.FEATURE,
            properties: {
                meta,
                parent: parentId,
                active: isSelected ? activeStates.ACTIVE : activeStates.INACTIVE,
                ...additionalProps
            },
            geometry: {
                type: geojsonTypes.POINT,
                coordinates: coordinates[currentVertexPosition]
            }
        };
    } catch (error) {
        console.log(error);
        return null;
    }
}
