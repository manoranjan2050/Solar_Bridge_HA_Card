import { LitElement, html, css } from "https://unpkg.com/lit@3.2.1/index.js?module";

const DEFAULT_CONFIG = {
  title: "Solar Bridge",
  card_style: "power-flow",
  solar_power_entity: "",
  battery_soc_entity: "",
  battery_power_entity: "",
  load_power_entity: "",
  grid_power_entity: "",
  today_generation_entity: "",
};

const CARD_VERSION = "1.1.0";

class SolarBridgeCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    config: { attribute: false },
  };

  static getStubConfig() {
    return {
      type: "custom:solar-bridge-card",
      title: "Solar Bridge",
      card_style: "power-flow",
      solar_power_entity: "sensor.solar_power",
      battery_soc_entity: "sensor.battery_soc",
      battery_power_entity: "sensor.battery_power",
      load_power_entity: "sensor.load_power",
      grid_power_entity: "sensor.grid_power",
      today_generation_entity: "sensor.today_generation",
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  getCardSize() {
    return 4;
  }

  _state(entityId) {
    if (!entityId || !this.hass?.states?.[entityId]) {
      return undefined;
    }

    return this.hass.states[entityId];
  }

  _number(entityId) {
    const stateObj = this._state(entityId);
    const value = Number.parseFloat(stateObj?.state);
    return Number.isFinite(value) ? value : 0;
  }

  _unit(entityId, fallback = "W") {
    return this._state(entityId)?.attributes?.unit_of_measurement || fallback;
  }

  _format(entityId, fallbackUnit = "W") {
    const stateObj = this._state(entityId);
    if (!stateObj) {
      return "--";
    }

    const unit = stateObj.attributes?.unit_of_measurement || fallbackUnit;
    const value = Number.parseFloat(stateObj.state);

    if (!Number.isFinite(value)) {
      return `${stateObj.state} ${unit}`.trim();
    }

    return `${Math.round(value * 10) / 10} ${unit}`.trim();
  }

  _flowClass(value, positiveClass = "active") {
    if (Math.abs(value) < 1) {
      return "idle";
    }

    return value > 0 ? positiveClass : "reverse";
  }

  _metric(label, entityId, fallbackUnit, icon) {
    return html`
      <button class="metric" @click=${() => this._openMoreInfo(entityId)} ?disabled=${!entityId}>
        <span class="metric-icon">${icon}</span>
        <span class="metric-copy">
          <span class="metric-label">${label}</span>
          <span class="metric-value">${this._format(entityId, fallbackUnit)}</span>
        </span>
      </button>
    `;
  }

  _openMoreInfo(entityId) {
    if (!entityId) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId },
      }),
    );
  }

  render() {
    if (!this.config || !this.hass) {
      return html``;
    }

    const solar = this._number(this.config.solar_power_entity);
    const battery = this._number(this.config.battery_power_entity);
    const load = this._number(this.config.load_power_entity);
    const grid = this._number(this.config.grid_power_entity);
    const soc = Math.max(0, Math.min(100, this._number(this.config.battery_soc_entity)));
    const gridLabel = grid >= 0 ? "Grid Import" : "Grid Export";
    const batteryLabel = battery >= 0 ? "Battery Charge" : "Battery Discharge";
    const cardStyle = ["power-flow", "dashboard", "compact"].includes(this.config.card_style)
      ? this.config.card_style
      : "power-flow";

    return html`
      <ha-card>
        <div class="card-shell ${cardStyle}">
          <header>
            <div>
              <p class="eyebrow">Energy Flow</p>
              <h2>${this.config.title}</h2>
            </div>
            <button
              class="generation"
              @click=${() => this._openMoreInfo(this.config.today_generation_entity)}
              ?disabled=${!this.config.today_generation_entity}
            >
              <span>Today</span>
              <strong>${this._format(this.config.today_generation_entity, "kWh")}</strong>
            </button>
          </header>

          <section class="flow-board" aria-label="Solar bridge power flow">
            <svg viewBox="0 0 420 250" role="img" aria-label="Animated solar, battery, load, and grid flow">
              <defs>
                <linearGradient id="solarBridgeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#ffe66d" />
                  <stop offset="45%" stop-color="#35d07f" />
                  <stop offset="100%" stop-color="#48b6ff" />
                </linearGradient>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g class="wire ${this._flowClass(solar)}">
                <path d="M112 62 C165 62 169 116 210 116" />
              </g>
              <g class="wire ${this._flowClass(load)}">
                <path d="M210 116 C255 116 263 62 313 62" />
              </g>
              <g class="wire ${this._flowClass(battery)}">
                <path d="M210 126 C210 163 163 178 143 198" />
              </g>
              <g class="wire ${this._flowClass(grid)}">
                <path d="M210 126 C210 163 259 178 280 198" />
              </g>

              <g class="node solar" @click=${() => this._openMoreInfo(this.config.solar_power_entity)}>
                <circle cx="84" cy="62" r="37" />
                <path d="M84 42 v40 M64 62 h40 M70 48 l28 28 M98 48 70 76" />
                <text x="84" y="117">Solar</text>
              </g>

              <g class="node bridge">
                <circle cx="210" cy="122" r="43" />
                <path d="M190 121 h40 M210 101 v40 M195 107 h30 M195 135 h30" />
                <text x="210" y="181">Bridge</text>
              </g>

              <g class="node load" @click=${() => this._openMoreInfo(this.config.load_power_entity)}>
                <circle cx="336" cy="62" r="37" />
                <path d="M318 65 h36 M323 79 h26 M328 48 h16 l5 17 h-26z" />
                <text x="336" y="117">Load</text>
              </g>

              <g class="node battery" @click=${() => this._openMoreInfo(this.config.battery_soc_entity)}>
                <rect x="96" y="179" width="76" height="43" rx="12" />
                <rect x="172" y="193" width="8" height="15" rx="3" />
                <rect class="battery-fill" x="102" y="185" width=${Math.max(6, soc * 0.64)} height="31" rx="8" />
                <text x="134" y="245">Battery ${Math.round(soc)}%</text>
              </g>

              <g class="node grid" @click=${() => this._openMoreInfo(this.config.grid_power_entity)}>
                <rect x="250" y="178" width="72" height="48" rx="12" />
                <path d="M262 212 h48 M268 200 h36 M274 188 h24" />
                <text x="286" y="245">Grid</text>
              </g>
            </svg>
          </section>

          <section class="metrics">
            ${this._metric("Solar Power", this.config.solar_power_entity, this._unit(this.config.solar_power_entity), "PV")}
            ${this._metric(batteryLabel, this.config.battery_power_entity, this._unit(this.config.battery_power_entity), "BT")}
            ${this._metric("Battery SOC", this.config.battery_soc_entity, "%", "%")}
            ${this._metric("Load Power", this.config.load_power_entity, this._unit(this.config.load_power_entity), "LD")}
            ${this._metric(gridLabel, this.config.grid_power_entity, this._unit(this.config.grid_power_entity), "GR")}
            ${this._metric("Today Generation", this.config.today_generation_entity, "kWh", "DY")}
          </section>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
      color: var(--primary-text-color);
    }

    ha-card {
      overflow: hidden;
      background:
        radial-gradient(circle at 22% 15%, rgba(255, 230, 109, 0.14), transparent 28%),
        radial-gradient(circle at 80% 16%, rgba(72, 182, 255, 0.14), transparent 30%),
        linear-gradient(145deg, #101820 0%, #16202a 48%, #0d1117 100%);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 16px;
      box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
    }

    .card-shell {
      padding: 18px;
    }

    .card-shell.compact {
      padding: 14px;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 8px;
    }

    .eyebrow {
      margin: 0 0 3px;
      color: #8eb4c7;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: #f6fbff;
      font-size: 22px;
      line-height: 1.15;
      font-weight: 750;
    }

    button {
      font: inherit;
    }

    button:disabled {
      cursor: default;
    }

    .generation {
      min-width: 112px;
      padding: 9px 12px;
      color: #f6fbff;
      text-align: right;
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.09);
      border-radius: 12px;
      cursor: pointer;
    }

    .generation span,
    .metric-label {
      display: block;
      color: #93a8b7;
      font-size: 11px;
      line-height: 1.2;
    }

    .generation strong {
      display: block;
      margin-top: 2px;
      color: #ffe66d;
      font-size: 16px;
      line-height: 1.2;
    }

    .flow-board {
      position: relative;
      width: 100%;
      aspect-ratio: 1.68;
      min-height: 210px;
    }

    .dashboard .flow-board {
      min-height: 170px;
    }

    .compact .flow-board {
      min-height: 132px;
      margin-top: -4px;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .wire path {
      fill: none;
      stroke: rgba(255, 255, 255, 0.16);
      stroke-width: 8;
      stroke-linecap: round;
    }

    .wire path::selection {
      background: transparent;
    }

    .wire.active path,
    .wire.reverse path {
      stroke: url(#solarBridgeGlow);
      stroke-dasharray: 14 13;
      filter: url(#softGlow);
      animation: flow 1.15s linear infinite;
    }

    .wire.reverse path {
      animation-direction: reverse;
    }

    .wire.idle path {
      stroke-dasharray: 0;
    }

    .node {
      cursor: pointer;
    }

    .node circle,
    .node rect {
      fill: rgba(255, 255, 255, 0.08);
      stroke: rgba(255, 255, 255, 0.18);
      stroke-width: 2;
    }

    .node path {
      fill: none;
      stroke: #e8f5ff;
      stroke-width: 5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .node text {
      fill: #c9d7e2;
      font-size: 14px;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
    }

    .solar circle {
      fill: rgba(255, 218, 82, 0.16);
    }

    .load circle {
      fill: rgba(53, 208, 127, 0.13);
    }

    .bridge circle {
      fill: rgba(72, 182, 255, 0.14);
    }

    .battery rect {
      fill: rgba(255, 255, 255, 0.08);
    }

    .battery-fill {
      fill: #35d07f !important;
      stroke: none !important;
      transition: width 0.4s ease;
    }

    .grid rect {
      fill: rgba(72, 182, 255, 0.12);
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 9px;
      margin-top: 8px;
    }

    .power-flow .metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .dashboard .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .compact .metrics {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 6px;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
      min-height: 62px;
      padding: 10px;
      color: #f6fbff;
      text-align: left;
      background: rgba(255, 255, 255, 0.065);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      cursor: pointer;
    }

    .compact .metric {
      display: grid;
      justify-items: center;
      gap: 6px;
      min-height: 68px;
      padding: 8px 6px;
      text-align: center;
    }

    .metric-icon {
      display: grid;
      place-items: center;
      flex: 0 0 32px;
      width: 32px;
      height: 32px;
      color: #0d1117;
      font-size: 16px;
      font-weight: 800;
      background: linear-gradient(135deg, #ffe66d, #35d07f);
      border-radius: 50%;
    }

    .compact .metric-icon {
      flex-basis: 28px;
      width: 28px;
      height: 28px;
      font-size: 12px;
    }

    .metric-copy {
      min-width: 0;
    }

    .metric-value {
      display: block;
      overflow: hidden;
      margin-top: 3px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 760;
      line-height: 1.2;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .compact .metric-label {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .compact .metric-value {
      font-size: 12px;
    }

    @keyframes flow {
      to {
        stroke-dashoffset: -54;
      }
    }

    @media (max-width: 560px) {
      .card-shell {
        padding: 14px;
      }

      header {
        align-items: flex-start;
      }

      h2 {
        font-size: 19px;
      }

      .generation {
        min-width: 96px;
      }

      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .compact .metrics {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .metric {
        min-height: 58px;
      }
    }

    @media (max-width: 380px) {
      header {
        flex-direction: column;
      }

      .generation {
        width: 100%;
        text-align: left;
      }

      .metrics {
        grid-template-columns: 1fr;
      }
    }
  `;
}

customElements.define("solar-bridge-card", SolarBridgeCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "solar-bridge-card",
  name: "Solar Bridge Card",
  description: "Animated solar, battery, load, and grid energy flow card.",
});

console.info(
  `%c Solar Bridge Card %c v${CARD_VERSION} `,
  "color: #0d1117; background: #ffe66d; font-weight: 700;",
  "color: #f6fbff; background: #16202a; font-weight: 700;",
);
