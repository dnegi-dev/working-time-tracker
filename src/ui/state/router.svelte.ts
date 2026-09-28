export type Route =
  | { name: 'today' | 'overview' | 'settings' }
  | { name: 'project'; id: string }
  | { name: 'do'; path: string };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h.startsWith('do/')) return { name: 'do', path: h.slice(3) };
  const [name, id] = h.split('/');
  if (name === 'project' && id) return { name: 'project', id };
  if (name === 'overview' || name === 'projects') return { name: 'overview' };
  if (name === 'settings') return { name };
  return { name: 'today' };
}

class Router {
  route: Route = $state(parseRoute(location.hash));
  constructor() {
    addEventListener('hashchange', () => (this.route = parseRoute(location.hash)));
  }
  go(path: string) {
    location.hash = `#/${path}`;
  }
}

export const router = new Router();
