import './styles/page.css';
import pluginMeta from './Plugin.Meta';

import {
  SystemPlugin,
  LogSystemAdapter,
  EventSystemAdapter,
  StyleSystemAdapter,
} from './../../DTCD-SDK';

import Sidebar from './utils/Sidebar';
import defaultPageAreas from './utils/defaultPageAreas';

export class AppGUISystem extends SystemPlugin {
  #logSystem;
  #eventSystem;
  #workspaceSystem;
  #styleSystem;

  #page;
  #sidebars = {};
  #pageAreas = defaultPageAreas;

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid) {
    super();
    this.guid = guid;
    this.#logSystem = new LogSystemAdapter('0.5.0', guid, pluginMeta.name);
    this.#eventSystem = new EventSystemAdapter('0.4.0', guid);
    this.#styleSystem = new StyleSystemAdapter('0.4.0');
    this.#eventSystem.registerPluginInstance(this, ['AreaClicked']);
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

    this.#eventSystem.resetSystem();
    this.toggleSidebar('left', false);
    this.toggleSidebar('right', false);

    for (const [area, content] of Object.entries(areas)) {
      if (!content) {
        this.#pageAreas[area].el.innerHTML = '';
        continue;
      }
      const { name, version, configuration } = content;
      if (name === 'WorkspaceSystem') {
        const { el } = this.#pageAreas[area];
        this.#workspaceSystem.mountDashboardContainer(el);
        continue;
      }

      this.mountPanelToGrid({ area, name, version });
      if (configuration) this.#pageAreas[area].panel.setPluginConfig(configuration);
    }
  }

  toggleSidebar(side, open) {
    if (!['left', 'right'].includes(side)) {
      this.#logSystem.debug(`Incorrect sidebar name: ${side}`);
      return;
    }

    const sidebar = this.#sidebars[side];

    if (typeof open !== 'boolean') {
      return sidebar.toggle();
    }

    return open ? sidebar.open() : sidebar.hide();
  }

  #initPage() {
    if (document.querySelector('#page.page')) {
      this.#logSystem.debug('The page has already been initiated');
      return false;
    }

    const page = document.createElement('div');
    page.id = 'page';
    page.className = 'page';
    this.#styleSystem.setVariablesToElement(page, this.#styleSystem.getCurrentTheme());
    this.#eventSystem.subscribe(
      this.#styleSystem.getGUID(),
      'ThemeUpdate',
      this.guid,
      'updateTheme'
    );

    Object.entries(this.#pageAreas).forEach(entry => {
      const [name, area] = entry;
      const el = document.createElement(area.tagName);
      el.onclick = () => {
        if (area.panel) {
          const guid = this.getGUID(area.panel);
          this.#eventSystem.publishEvent('AreaClicked', { guid });
        }
      };
      el.id = area.id;
      el.className = 'page-area';
      area.el = el;

      if (['left', 'right'].includes(name)) {
        this.#sidebars[name] = new Sidebar(name, el);
      }

      page.appendChild(el);
    });

    document.body.appendChild(page);
    return page;
  }

  updateTheme() {
    this.#styleSystem.setVariablesToElement(this.#page, this.#styleSystem.getCurrentTheme());
  }
}
