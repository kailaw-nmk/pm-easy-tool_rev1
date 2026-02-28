let _container: HTMLDivElement | null = null;

export function setGanttContainer(el: HTMLDivElement | null) {
  _container = el;
}

export function getGanttContainer(): HTMLDivElement | null {
  return _container;
}
