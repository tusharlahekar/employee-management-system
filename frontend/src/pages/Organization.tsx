import { useEffect, useState } from 'react';
import { ChevronRight, ChevronDown, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Card, RoleBadge } from '../components/ui';
import type { ApiResponse, OrgNode } from '../types';

function TreeNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="flex items-center gap-2 rounded-lg py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
        {hasChildren ? (
          <button onClick={() => setOpen((o) => !o)} className="text-slate-400">
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <User className="h-4 w-4 text-indigo-500" />
        <Link to={`/employees/${node._id}`} className="font-medium hover:text-indigo-600">
          {node.name}
        </Link>
        <span className="text-xs text-slate-400">{node.designation}</span>
        <RoleBadge role={node.role} />
      </div>
      {open && hasChildren && (
        <div className="border-l border-slate-200 dark:border-slate-800">
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Organization() {
  const [tree, setTree] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<OrgNode[]>>('/organization/tree')
      .then((res) => setTree(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Organizational Hierarchy</h1>
      <Card>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : tree.length === 0 ? (
          <p className="text-sm text-slate-400">No employees found.</p>
        ) : (
          tree.map((root) => <TreeNode key={root._id} node={root} />)
        )}
      </Card>
    </div>
  );
}
