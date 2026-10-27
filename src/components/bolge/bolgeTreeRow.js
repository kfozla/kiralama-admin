"use client";

import { ChevronDown, ChevronRight, FolderTree, MapPin } from "lucide-react";

import BolgeActions from "./bolgeActions";

export default function BolgeTreeRow({
  node,
  depth = 0,
  expandedIds,
  onToggle,
  onAddChild,
  onEdit,
  onDelete,
  parentName = null,
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);

  return (
    <>
      <tr className="group border-b border-slate-100 transition-colors hover:bg-slate-50/70">
        <td className="px-5 py-3.5 sm:px-6">
          <div
            className="flex min-w-max items-center gap-2"
            style={{ paddingLeft: `${depth * 28}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                aria-label={
                  isExpanded
                    ? `${node.ad} alt bölgelerini kapat`
                    : `${node.ad} alt bölgelerini aç`
                }
                aria-expanded={isExpanded}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200"
              >
                {isExpanded ? (
                  <ChevronDown size={17} />
                ) : (
                  <ChevronRight size={17} />
                )}
              </button>
            ) : (
              <div className="h-7 w-7 shrink-0" />
            )}

            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                depth === 0
                  ? "bg-blue-50 text-blue-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {hasChildren ? <FolderTree size={18} /> : <MapPin size={17} />}
            </div>

            <div>
              <p
                className={`text-sm ${
                  depth === 0
                    ? "font-bold text-slate-900"
                    : "font-semibold text-slate-700"
                }`}
              >
                {node.ad}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">#{node.id}</p>
            </div>
          </div>
        </td>

        <td className="px-5 py-3.5 text-sm text-slate-600 sm:px-6">
          {parentName ?? <span className="text-slate-400">Ana Bölge</span>}
        </td>

        <td className="px-5 py-3.5 text-center sm:px-6">
          <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
            {node.children.length}
          </span>
        </td>

        <td className="w-28 px-5 py-3.5 sm:px-6">
          <div className="flex justify-center">
            <BolgeActions
              bolge={node}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </td>
      </tr>

      {hasChildren &&
        isExpanded &&
        node.children.map((child) => (
          <BolgeTreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            parentName={node.ad}
            expandedIds={expandedIds}
            onToggle={onToggle}
            onAddChild={onAddChild}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </>
  );
}
