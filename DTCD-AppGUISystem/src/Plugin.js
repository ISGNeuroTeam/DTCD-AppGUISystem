import { SystemPlugin, LogSystemAdapter, EventSystemAdapter, StyleSystemAdapter } from './../../DTCD-SDK';

import Sidebar from './utils/Sidebar';
import defaultPageAreas from './utils/defaultPageAreas';

import './styles/page.css';
import './styles/page404.scss';
import pluginMeta from './Plugin.Meta';
import Page403Html from './templates/page403.html';
import Page404Html from './templates/page404.html';

export class AppGUISystem extends SystemPlugin {
  #logSystem;
  #eventSystem;
  #workspaceSystem;
  #styleSystem;

  #page;
  #sidebars = {};
  #pageAreas = defaultPageAreas;
  #pageAreaCenter;

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
      // const panelMeta = panel.constructor.getRegistrationMeta();
      // if (panelMeta.name === name && panelMeta.version === version) return;
      this.uninstallPluginByInstance(panel);
    }

    if (name === 'WorkspaceSystem') {
      const { el } = this.#pageAreas[area];
      this.#workspaceSystem.mountDashboardContainer(el);
      return;
    }

    const mountID = `${id}--panel`;
    el.innerHTML = `<div id="${mountID}"></div>`;

    this.#pageAreas[area].panel = this.installPanel({
      name,
      version,
      guid: `${name}_${area}`,
      selector: `#${mountID}`,
    });
  }

  applyPageConfig(config = {}) {
    const { areas } = config;

    this.resetSystems();
    this.toggleSidebar('left', false);
    this.toggleSidebar('right', false);

    for (const [area, content] of Object.entries(areas)) {
      if (!content) {
        this.#pageAreas[area].el.innerHTML = '';
        continue;
      }

      const { name, version, configuration } = content;

      this.mountPanelToGrid({ area, name, version });

      if (configuration) {
        this.#pageAreas[area].panel.setPluginConfig(configuration);
      }
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
    this.#eventSystem.subscribe(this.#styleSystem.getGUID(), 'ThemeUpdate', this.guid, 'updateTheme');

    Object.entries(this.#pageAreas).forEach(entry => {
      const [name, area] = entry;
      const el = document.createElement(area.tagName);
      el.id = area.id;
      el.onclick = () => {
        if (area.panel) {
          const guid = this.getGUID(area.panel);
          guid && this.#eventSystem.publishEvent('AreaClicked', { guid });
        }
      };

      if (['left', 'right'].includes(name)) {
        this.#sidebars[name] = new Sidebar(name, el);
      }

      area.el = el;
      page.appendChild(el);

      if (area.id === 'pageAreaCenter') {
        this.#pageAreaCenter = el;
      }
    });

    document.body.appendChild(page);
    return page;
  }

  updateTheme() {
    this.#styleSystem.setVariablesToElement(this.#page, this.#styleSystem.getCurrentTheme());
  }

  goTo403() {
    this.#pageAreaCenter.innerHTML = Page403Html;
    this.#goHomePage();
  }

  goTo404() {
    this.#pageAreaCenter.innerHTML = Page404Html;
    this.#goHomePage();
  }

  #goHomePage() {
    const buttons = this.#pageAreaCenter.querySelectorAll('.backHome-js');
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        this.getSystem('RouteSystem', '0.1.0').navigate('/workspaces');
      });
    });
  }
}
