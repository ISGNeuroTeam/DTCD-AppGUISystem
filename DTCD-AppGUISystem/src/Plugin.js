import './styles/page.css';
import pluginMeta from './Plugin.Meta';

import { SystemPlugin, LogSystemAdapter, EventSystemAdapter } from './../../DTCD-SDK';

import defaultPageAreas from './utils/defaultPageAreas';

export class AppGUISystem extends SystemPlugin {
  #logSystem;
  #eventSystem;
  #workspaceSystem;

  #page;
  #pageAreas = defaultPageAreas;

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid) {
    super();
    this.#logSystem = new LogSystemAdapter('0.5.0', guid, pluginMeta.name);
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#workspaceSystem = this.getSystem('WorkspaceSystem', '0.4.0');
  }

  async init() {
    this.#page = this.#initPage();
  }

  mountPanelToGrid(options = {}) {
    const { area, name, version } = options;
    const { id, el, panel } = this.#pageAreas[area];

    if (panel) {
      this.uninstallPluginByInstance(panel);
    }

    const mountID = `${id}--panel`;
    el.innerHTML = `<div id="${mountID}"></div>`;

    this.#pageAreas[area].panel = this.installPanel({
      name,
      version,
      selector: `#${mountID}`,
    });
  }

  applyPageConfig(config = {}) {
    const { areas } = config;
    for (const [area, content] of Object.entries(areas)) {
      if (!content) {
        this.#pageAreas[area].el.innerHTML = '';
        continue;
      }
      const { name, version } = content;
      if (name === 'WorkspaceSystem') {
        const { el } = this.#pageAreas[area];
        this.#workspaceSystem.mountDashboardContainer(el);
      } else {
        this.mountPanelToGrid({ area, name, version });
      }
    }
  }

  #initPage() {
    if (document.querySelector('#page.page')) {
      this.#logSystem.debug('The page has already been initiated');
      return false;
    }

    const page = document.createElement('div');
    page.id = 'page';
    page.className = 'page';

    Object.values(this.#pageAreas).forEach(area => {
      const el = document.createElement(area.tagName);
      el.id = area.id;
      area.el = el;
      page.appendChild(el);
    });

    document.body.appendChild(page);
    return page;
  }
}
