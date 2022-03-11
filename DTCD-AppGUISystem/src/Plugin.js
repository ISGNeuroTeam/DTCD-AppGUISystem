import './styles/page.css';
import pluginMeta from './Plugin.Meta';

import { SystemPlugin } from './../../DTCD-SDK';
import homepageConfig from './utils/_HOMEPAGE.json';

export class AppGUISystem extends SystemPlugin {

  #pageAreas = {
    top: { id: 'pageAreaTop' },
    left: { id: 'pageAreaLeft' },
    center: { id: 'pageAreaCenter' },
    right: { id: 'pageAreaRight' },
    bottom: { id: 'pageAreaBottom' },
  }

  static getRegistrationMeta() {
    return pluginMeta;
  }

  constructor(guid) {
    super();
  }

  init() {
    this.#initPage();
    this.applyPageConfig(homepageConfig);
  }

  mountPanelToGrid(options = {}) {
    const { area, name, version } = options;
    const { id, el, plugin } = this.#pageAreas[area];

    if (plugin) {
      this.uninstallPluginByInstance(plugin);
    }

    const mountID = `${id}--panel`;
    el.innerHTML = `<div id="${mountID}"></div>`;

    this.#pageAreas[area].plugin = this.installPanel({
      name,
      version,
      selector: `#${mountID}`,
    });
  }

  applyPageConfig(config = {}) {
    const { areas } = config;
    for (const [area, content] of Object.entries(areas)) {
      if (!content) continue;
      const { name, version } = content;
      this.mountPanelToGrid({ area, name, version });
    }
  }

  #initPage() {
    const page = document.createElement('div');
    page.className = 'page';
    page.innerHTML = `
      <header id="pageAreaTop"></header>
      <aside id="pageAreaLeft"></aside>
      <main id="pageAreaCenter"></main>
      <aside id="pageAreaRight"></aside>
      <footer id="pageAreaBottom"></footer>
    `;
    document.body.appendChild(page);

    Object.values(this.#pageAreas).forEach(area => {
      area.el = document.getElementById(area.id);
    });

    return page;
  }

}
