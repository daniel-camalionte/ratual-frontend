import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ApexOptions } from "apexcharts";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Chart } from "@/components/charts/Chart";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { fmtNum, fmtTemp, parseData } from "@/features/monitoramento/dados";
import { FaixaEditor } from "@/features/monitoramento/components/FaixaEditor";
import { LinhaDoTempo } from "@/features/monitoramento/components/LinhaDoTempo";
import { ReleBotao } from "@/features/monitoramento/components/ReleBotao";
import { useRefrigeradores } from "@/features/monitoramento/useMonitoramento";
import type {
  EventosResponse,
  GraficoDispositivo,
} from "@/features/monitoramento/types";
import { useApi } from "@/lib/useApi";
import "@/features/monitoramento/monitoramento.css";

const PERIODOS = [
  { horas: 24, label: "24 h" },
  { horas: 72, label: "3 dias" },
  { horas: 168, label: "7 dias" },
] as const;

const STATUS_BADGE = {
  normal: { tone: "success", label: "Normal" },
  alerta: { tone: "warning", label: "Alerta" },
  offline: { tone: "danger", label: "Offline" },
} as const;

function qualidadeSinal(rssi: number | null): string {
  if (rssi === null) return "--";
  if (rssi >= -60) return "Ótimo";
  if (rssi >= -70) return "Bom";
  return "Fraco";
}

export default function RefrigeradorDetalhePage() {
  const { id } = useParams();
  const [horas, setHoras] = useState<number>(24);
  const lista = useRefrigeradores();
  const grafico = useApi<GraficoDispositivo>(
    id
      ? `/v1/ewelink/dispositivo/${encodeURIComponent(id)}/grafico?horas=${horas}`
      : null,
    { refreshMs: 5 * 60_000 },
  );
  const eventos = useApi<EventosResponse>(
    id ? `/v1/eventos?deviceid=${encodeURIComponent(id)}&limite=100` : null,
    { refreshMs: 60_000 },
  );

  const r = lista.refrigeradores.find((d) => d.id === id);
  const { reload: recarregarLista } = lista;
  const { reload: recarregarEventos } = eventos;
  const alterado = () => {
    recarregarLista();
    recarregarEventos();
  };

  const pontos = useMemo(
    () =>
      (grafico.data?.pontos ?? []).map(
        (p) =>
          [parseData(p.data)?.getTime() ?? 0, p.temperatura] as [
            number,
            number | null,
          ],
      ),
    [grafico.data],
  );
  const temLeitura = pontos.some((p) => p[1] !== null);
  const res = grafico.data?.resumo;
  const faixaMin = r?.faixa.min ?? null;
  const faixaMax = r?.faixa.max ?? null;

  const options: ApexOptions = {
    colors: ["#1B84FF"],
    legend: { show: false },
    stroke: { curve: "smooth", width: 2.2 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      tickAmount: 5,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        datetimeUTC: false,
        format: horas > 24 ? "dd/MM HH:mm" : "HH:mm",
      },
    },
    yaxis: { labels: { formatter: (v: number) => `${Math.round(v)}°` } },
    annotations:
      faixaMin !== null && faixaMax !== null
        ? {
            yaxis: [
              {
                y: faixaMin,
                y2: faixaMax,
                fillColor: "#2cd07e",
                opacity: 0.12,
                borderColor: "transparent",
              },
            ],
          }
        : {},
    tooltip: {
      x: { format: "dd/MM HH:mm" },
      y: { formatter: (v: number) => `${fmtTemp(v)} °C` },
    },
  };

  if (lista.loading) return <Spinner />;
  if (!r) {
    return (
      <Card>
        <p className="fw-medium mb-2">
          {lista.error ?? "Refrigerador não encontrado."}
        </p>
        <Link to="/refrigeradores">Voltar para a lista</Link>
      </Card>
    );
  }

  const badge = STATUS_BADGE[r.status];
  const temFaixa = r.faixa.min !== null && r.faixa.max !== null;

  return (
    <>
      <Link
        to="/refrigeradores"
        className="d-inline-flex align-items-center text-muted text-decoration-none mb-3"
        style={{ minHeight: 44 }}
      >
        ‹ Refrigeradores
      </Link>

      <Card className="mb-3">
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div className="min-w-0">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h4 className="fw-medium mb-0">{r.nome}</h4>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
            <p className="text-muted small mb-0 mt-1">
              {r.tipo === "congelado" ? "Congelados" : "Resfriados"}
              {r.modelo && ` · ${r.modelo}`} · ID {r.id}
              {r.empresa && ` · ${r.empresa}`}
            </p>
          </div>
          <div>
            <div className={`rt-detail-temp is-${r.status}`}>
              {fmtTemp(r.temperatura)}
              <small> °C</small>
            </div>
            <p className="text-muted small mb-0">
              {r.online ? "temperatura atual" : "última leitura recebida"}
            </p>
          </div>
        </div>

        <hr />
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md">
            <p className="mb-2 small">
              Faixa ideal:{" "}
              <strong>
                {temFaixa
                  ? `${fmtNum(r.faixa.min)} a ${fmtNum(r.faixa.max)} °C`
                  : "não definida"}
              </strong>
              {r.toleranciaMin !== null &&
                ` · tolerância ${r.toleranciaMin} min`}
            </p>
            <FaixaEditor
              key={`${r.faixa.min}-${r.faixa.max}-${r.tipo}-${r.toleranciaMin}`}
              r={r}
              onSalvo={alterado}
            />
          </div>
          <div className="col-12 col-md-auto d-flex">
            <ReleBotao r={r} onAlterado={alterado} />
          </div>
          <div className="col-12 col-md-auto small">
            <span className="text-muted">Sinal Wi-Fi</span>
            <div className="fw-medium">
              {qualidadeSinal(r.sinal)}
              {r.sinal !== null && (
                <span className="text-muted"> · {r.sinal} dBm</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card
        className="mb-3"
        title="Histórico de temperatura"
        subtitle={
          temFaixa
            ? "Faixa ideal destacada em verde · leitura a cada 5 minutos"
            : "Leitura a cada 5 minutos"
        }
        actions={
          <div
            className="btn-group btn-group-sm flex-nowrap rt-periodos"
            role="group"
            aria-label="Período do gráfico"
          >
            {PERIODOS.map((p) => (
              <button
                key={p.horas}
                type="button"
                className={`btn text-nowrap ${horas === p.horas ? "btn-primary" : "btn-outline-primary"}`}
                aria-pressed={horas === p.horas}
                onClick={() => setHoras(p.horas)}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
        {grafico.error && <Alert tone="danger">{grafico.error}</Alert>}
        {grafico.loading && !grafico.data ? (
          <Spinner />
        ) : temLeitura ? (
          <Chart
            type="area"
            label={`Gráfico de área: temperatura de ${r.nome} nas últimas ${horas} horas`}
            series={[{ name: "Temperatura", data: pontos }]}
            options={options}
            height={320}
          />
        ) : (
          !grafico.error && (
            <p className="text-muted text-center py-5 mb-0">
              Sem leituras neste período.
            </p>
          )
        )}
      </Card>

      {res && res.minima !== null && (
        <div className="row g-3 mb-3">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Mínima no período"
              value={`${fmtTemp(res.minima)} °C`}
              icon="arrow-down"
              tone="primary"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Máxima no período"
              value={`${fmtTemp(res.maxima)} °C`}
              icon="arrow-up"
              tone="warning"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Média no período"
              value={`${fmtTemp(res.media)} °C`}
              icon="temperature"
              tone="info"
            />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard
              label="Compressor ligado"
              value={
                res.compressor_ligado_pct === null
                  ? "--"
                  : `${fmtNum(res.compressor_ligado_pct)}%`
              }
              icon="power"
              tone="success"
            />
          </div>
        </div>
      )}

      <Card
        title="Linha do tempo"
        subtitle="Alertas, comandos do compressor e mudanças detectadas"
      >
        {eventos.error && <Alert tone="danger">{eventos.error}</Alert>}
        {eventos.loading && !eventos.data ? (
          <Spinner />
        ) : (
          <LinhaDoTempo
            eventos={eventos.data?.eventos ?? []}
            mostrarAparelho={false}
            vazio="Nenhuma ocorrência registrada para este refrigerador."
          />
        )}
      </Card>
    </>
  );
}
