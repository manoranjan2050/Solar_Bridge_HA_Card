# Solar Bridge Card

Modern animated solar energy flow card for Home Assistant.

Built for dashboards that use the Solar Bridge Flin/Fution/JKBMS project, but configurable for any Home Assistant entities.

## Features

- Animated SVG solar power flow
- Solar power entity
- Battery SOC entity
- Battery power entity
- Load power entity
- Grid import/export entity
- Today generation entity
- Modern dark UI
- Mobile responsive layout
- LitElement based custom card
- HACS compatible repository structure

## Installation with HACS

1. Open HACS in Home Assistant.
2. Go to **Frontend**.
3. Open the three-dot menu and choose **Custom repositories**.
4. Add this repository URL:

   ```text
   https://github.com/manoranjan2050/Solar_Bridge_HA_Card
   ```

5. Select category **Dashboard**.
6. Install **Solar Bridge Card**.
7. Refresh your browser.

## Manual Installation

1. Copy `solar-bridge-card.js` to:

   ```text
   /config/www/community/solar-bridge-card/solar-bridge-card.js
   ```

2. Add this resource in Home Assistant:

   ```yaml
   url: /local/community/solar-bridge-card/solar-bridge-card.js
   type: module
   ```

3. Refresh your browser.

## Example Configuration

```yaml
type: custom:solar-bridge-card
title: Solar Bridge
solar_power_entity: sensor.solar_power
battery_soc_entity: sensor.battery_soc
battery_power_entity: sensor.battery_power
load_power_entity: sensor.load_power
grid_power_entity: sensor.grid_power
today_generation_entity: sensor.today_generation
```

## Configuration Options

| Option | Required | Description |
| --- | --- | --- |
| `type` | Yes | Must be `custom:solar-bridge-card` |
| `title` | No | Card title. Defaults to `Solar Bridge` |
| `solar_power_entity` | Yes | Current solar production power sensor |
| `battery_soc_entity` | Yes | Battery state of charge sensor |
| `battery_power_entity` | Yes | Battery charge/discharge power sensor |
| `load_power_entity` | Yes | Current load power sensor |
| `grid_power_entity` | Yes | Grid import/export power sensor |
| `today_generation_entity` | Yes | Today's generated energy sensor |

## Entity Direction Notes

- `grid_power_entity` positive values are shown as import.
- `grid_power_entity` negative values are shown as export.
- `battery_power_entity` positive values are shown as charging.
- `battery_power_entity` negative values are shown as discharging.

## Development

No build step is required. The card imports Lit directly as an ES module and can be served as `solar-bridge-card.js`.

```bash
npm install
npm run build
```

## GitHub Repository

```text
https://github.com/manoranjan2050/Solar_Bridge_HA_Card
```

## Related Project

Solar Bridge Flin/Fution/JKBMS:

```text
https://github.com/manoranjan2050/Solar-Bridge-Flin-Fution-JKBMS
```

## License

MIT
