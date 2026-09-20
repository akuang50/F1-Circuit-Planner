"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { Circuit, StationProvenance } from "@/types/api";

export function CircuitMap({
  circuit,
  provenance,
}: {
  circuit: Circuit;
  provenance: StationProvenance;
}) {
  return (
    <MapContainer
      key={`${circuit.id}-${provenance.station_id}`}
      center={[circuit.latitude, circuit.longitude]}
      zoom={9}
      scrollWheelZoom={false}
      className="h-56 w-full rounded-2xl"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <CircleMarker
        center={[circuit.latitude, circuit.longitude]}
        radius={10}
        pathOptions={{ color: "#e10600", fillColor: "#e10600", fillOpacity: 0.9 }}
      >
        <Tooltip permanent>{circuit.name}</Tooltip>
      </CircleMarker>
      <CircleMarker
        center={[provenance.latitude, provenance.longitude]}
        radius={8}
        pathOptions={{ color: "#00d2be", fillColor: "#00d2be", fillOpacity: 0.9 }}
      >
        <Tooltip>{provenance.station_name}</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
