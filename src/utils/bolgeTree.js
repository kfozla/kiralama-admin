export function buildBolgeTree(bolgeler = []) {
  const nodeMap = new Map();
  const roots = [];

  for (const bolge of bolgeler) {
    nodeMap.set(Number(bolge.id), {
      ...bolge,
      id: Number(bolge.id),
      parentBolgeId:
        bolge.parentBolgeId == null ? null : Number(bolge.parentBolgeId),
      children: [],
    });
  }

  for (const node of nodeMap.values()) {
    const parent = nodeMap.get(node.parentBolgeId);

    // Eksik veya geçersiz parent varsa node'u kaybetme.
    if (
      parent &&
      parent.id !== node.id &&
      !wouldCreateCycle(node, parent, nodeMap)
    ) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => a.ad.localeCompare(b.ad, "tr"));

    for (const node of nodes) {
      sortNodes(node.children);
    }
  };

  sortNodes(roots);
  return roots;
}

function wouldCreateCycle(node, parent, nodeMap) {
  const visited = new Set([node.id]);
  let current = parent;

  while (current) {
    if (visited.has(current.id)) return true;

    visited.add(current.id);

    current =
      current.parentBolgeId == null ? null : nodeMap.get(current.parentBolgeId);
  }

  return false;
}

export function flattenBolgeTree(nodes, depth = 0, result = []) {
  for (const node of nodes) {
    result.push({ ...node, depth });

    flattenBolgeTree(node.children, depth + 1, result);
  }

  return result;
}

export function getDescendantIds(bolgeler, parentId) {
  const childrenByParent = new Map();

  for (const bolge of bolgeler) {
    const key =
      bolge.parentBolgeId == null ? null : Number(bolge.parentBolgeId);

    if (!childrenByParent.has(key)) {
      childrenByParent.set(key, []);
    }

    childrenByParent.get(key).push(Number(bolge.id));
  }

  const descendants = new Set();
  const visited = new Set([Number(parentId)]);
  const stack = [Number(parentId)];

  while (stack.length > 0) {
    const currentId = stack.pop();

    for (const childId of childrenByParent.get(currentId) ?? []) {
      if (visited.has(childId)) continue;

      visited.add(childId);
      descendants.add(childId);
      stack.push(childId);
    }
  }

  return descendants;
}

export function filterBolgeTree(nodes, search) {
  const query = search.trim().toLocaleLowerCase("tr-TR");

  if (!query) return nodes;

  const filterNodes = (list) => {
    const result = [];

    for (const node of list) {
      const nameMatches = node.ad.toLocaleLowerCase("tr-TR").includes(query);

      const matchedChildren = filterNodes(node.children);

      // Üst bölgenin adı eşleşirse bütün alt dallarını göster.
      if (nameMatches) {
        result.push(node);
      } else if (matchedChildren.length > 0) {
        // Alt bölge eşleştiyse üst bölgeyi de görünür tut.
        result.push({
          ...node,
          children: matchedChildren,
        });
      }
    }

    return result;
  };

  return filterNodes(nodes);
}

export function getExpandableIds(nodes) {
  const ids = [];

  const visit = (list) => {
    for (const node of list) {
      if (node.children.length > 0) {
        ids.push(node.id);
        visit(node.children);
      }
    }
  };

  visit(nodes);
  return ids;
}
