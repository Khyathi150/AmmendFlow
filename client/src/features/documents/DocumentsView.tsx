import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Stage, Layer, Rect, Circle, Text as KonvaText } from 'react-konva';
import {
  FolderClosed,
  Upload,
  FileText,
  MapPin,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Building2,
  Plus,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatDateTime } from '../../lib/utils';

export const DocumentsView: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Drawing');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadProjectId, setUploadProjectId] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Drawing Annotation Tool State
  const [activeTool, setActiveTool] = useState<'select' | 'rect' | 'marker'>('rect');
  const [zoom, setZoom] = useState(1);
  const [annotationColor, setAnnotationColor] = useState('#C53030');
  const [annotationComment, setAnnotationComment] = useState('');

  // Canvas drawing state
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageDimensions, setStageDimensions] = useState({ width: 700, height: 450 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', projectId, category],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId !== 'all') params.append('projectId', projectId);
      if (category !== 'all') params.append('category', category);
      const res: any = await api.get(`/documents?${params.toString()}`);
      return res.data;
    },
  });
  const documents = documentsData?.documents || [];

  // Active selected document
  const activeDoc = documents.find((d: any) => d._id === selectedDocId) || documents[0];

  // Annotations for active document
  const { data: annotationsData } = useQuery({
    queryKey: ['annotations', activeDoc?._id],
    queryFn: async () => {
      if (!activeDoc) return null;
      const res: any = await api.get(`/documents/${activeDoc._id}/annotations`);
      return res.data;
    },
    enabled: Boolean(activeDoc?._id),
  });
  const annotations = annotationsData?.annotations || [];

  // Resize listener for Konva Stage
  useEffect(() => {
    if (containerRef.current) {
      setStageDimensions({
        width: containerRef.current.offsetWidth,
        height: Math.max(450, containerRef.current.offsetHeight),
      });
    }
  }, [containerRef.current, activeDoc]);

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res: any = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsUploadOpen(false);
      setUploadFile(null);
      setSelectedDocId(data.attachment._id);
    },
    onError: (err: any) => {
      setUploadError(err.message || 'File upload failed');
    },
  });

  // Save Annotation Mutation
  const createAnnotationMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post(`/documents/${activeDoc._id}/annotations`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', activeDoc?._id] });
      setNewShape(null);
      setAnnotationComment('');
    },
  });

  // Delete Annotation Mutation
  const deleteAnnotationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res: any = await api.delete(`/documents/annotations/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', activeDoc?._id] });
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    const targetProject = uploadProjectId || projects[0]?._id;
    if (!targetProject) {
      setUploadError('Please select a target project.');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('projectId', targetProject);
    formData.append('category', uploadCategory);
    formData.append('notes', uploadNotes);

    uploadMutation.mutate(formData);
  };

  // Konva Canvas Events
  const handleMouseDown = (e: any) => {
    if (activeTool === 'select') return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    if (activeTool === 'marker') {
      // Store normalized coordinates (0.0 - 1.0)
      const normX = pos.x / (stageDimensions.width * zoom);
      const normY = pos.y / (stageDimensions.height * zoom);
      createAnnotationMutation.mutate({
        type: 'marker',
        normalizedX: Math.max(0, Math.min(1, normX)),
        normalizedY: Math.max(0, Math.min(1, normY)),
        color: annotationColor,
        label: `M${annotations.length + 1}`,
        comment: annotationComment || `Marker at point`,
      });
      return;
    }

    if (activeTool === 'rect') {
      setIsDrawing(true);
      setNewShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newShape) return;
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setNewShape({
      ...newShape,
      width: pos.x - newShape.x,
      height: pos.y - newShape.y,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newShape) return;
    setIsDrawing(false);

    const stageWidth = stageDimensions.width * zoom;
    const stageHeight = stageDimensions.height * zoom;

    // Normalize coordinates
    const normX = Math.min(newShape.x, newShape.x + newShape.width) / stageWidth;
    const normY = Math.min(newShape.y, newShape.y + newShape.height) / stageHeight;
    const normW = Math.abs(newShape.width) / stageWidth;
    const normH = Math.abs(newShape.height) / stageHeight;

    if (normW > 0.02 && normH > 0.02) {
      createAnnotationMutation.mutate({
        type: 'rect',
        normalizedX: Math.max(0, Math.min(1, normX)),
        normalizedY: Math.max(0, Math.min(1, normY)),
        normalizedWidth: Math.max(0, Math.min(1, normW)),
        normalizedHeight: Math.max(0, Math.min(1, normH)),
        color: annotationColor,
        label: `REV-${annotations.length + 1}`,
        comment: annotationComment || `Variation Revision Cloud`,
      });
    }
    setNewShape(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Engineering Drawings & Document Repository
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Vector canvas markup overlays, normalized coordinate mapping, and change substantiation
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={Upload}
          onClick={() => {
            setUploadProjectId(projects[0]?._id || '');
            setIsUploadOpen(true);
          }}
        >
          Upload Document / Blueprint
        </Button>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Document Explorer (Left Sidebar) */}
        <Card className="lg:col-span-1 space-y-3">
          <CardHeader className="pb-2">
            <div>
              <CardTitle>Documents Index</CardTitle>
              <CardDescription>Blueprints, site evidence, drawings</CardDescription>
            </div>
          </CardHeader>

          {/* Project & Category filters */}
          <div className="space-y-2">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
            >
              <option value="all">All Projects</option>
              {projects.map((p: any) => (
                <option key={p._id} value={p._id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-8 px-2 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Drawing">Drawings & Blueprints</option>
              <option value="Site Photo">Site Photos</option>
              <option value="Variation Evidence">Variation Evidence</option>
              <option value="Contract">Contracts & Schedules</option>
            </select>
          </div>

          {/* Document list */}
          <div className="divide-y divide-border border border-border rounded-lg max-h-[500px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-text-muted">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">No documents uploaded yet.</div>
            ) : (
              documents.map((doc: any) => {
                const isSelected = activeDoc?._id === doc._id;
                return (
                  <button
                    key={doc._id}
                    onClick={() => setSelectedDocId(doc._id)}
                    className={`w-full p-2.5 text-left text-xs transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-secondary-light/40 border-l-4 border-l-secondary text-text-primary'
                        : 'hover:bg-surface-subtle text-text-secondary'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text-primary truncate">{doc.originalName}</div>
                      <div className="text-[10px] text-text-muted mt-0.5 flex items-center justify-between">
                        <span>{doc.category}</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Drawing & Konva Annotation Stage (Right Main Area) */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-0 overflow-hidden border border-border bg-surface">
            {/* Stage Toolbar */}
            <div className="p-3 bg-surface-subtle border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-text-primary truncate max-w-xs">
                  {activeDoc?.originalName || 'No Document Selected'}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-muted text-text-muted text-[10px] font-mono">
                  {activeDoc?.category}
                </span>
              </div>

              {/* Drawing Tools */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTool('rect')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-all ${
                    activeTool === 'rect'
                      ? 'border-secondary bg-secondary text-white shadow-sm'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Revision Box
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('marker')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-all ${
                    activeTool === 'marker'
                      ? 'border-secondary bg-secondary text-white shadow-sm'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" /> Pin Marker
                </button>

                {/* Color choices */}
                <div className="flex items-center gap-1 pl-2 border-l border-border">
                  {['#C53030', '#D97706', '#357B75', '#1D4ED8'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAnnotationColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        annotationColor === c ? 'scale-110 border-text-primary' : 'border-white'
                      }`}
                    />
                  ))}
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1 pl-2 border-l border-border">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-muted"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[10px] text-text-secondary w-9 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                    className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-muted"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Note input for next annotation */}
            <div className="px-4 py-2 bg-surface border-b border-border flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-text-secondary shrink-0">
                Annotation Note:
              </span>
              <input
                type="text"
                placeholder="e.g. Relocate water supply header pipe to clear HVAC duct (CO-002)..."
                value={annotationComment}
                onChange={(e) => setAnnotationComment(e.target.value)}
                className="w-full h-7 px-2 rounded border border-border bg-surface-subtle text-xs text-text-primary focus:bg-surface focus:outline-none"
              />
            </div>

            {/* Interactive Canvas Canvas Area */}
            <div
              ref={containerRef}
              className="relative bg-surface-muted overflow-auto flex items-center justify-center p-4 min-h-[460px]"
            >
              <div
                style={{
                  width: stageDimensions.width * zoom,
                  height: stageDimensions.height * zoom,
                  backgroundImage:
                    'radial-gradient(circle, #CFD6D9 1px, transparent 1px), linear-gradient(to right, #F5F6F4, #FFFFFF)',
                  backgroundSize: '20px 20px, 100% 100%',
                }}
                className="relative border border-border shadow-subtle bg-white overflow-hidden cursor-crosshair select-none"
              >
                {/* Simulated Engineering Blueprint Grid & Structural Axes */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className="w-full h-full border-2 border-dashed border-primary" />
                  <div className="absolute top-1/3 left-0 right-0 border-t border-primary" />
                  <div className="absolute top-2/3 left-0 right-0 border-t border-primary" />
                  <div className="absolute left-1/3 top-0 bottom-0 border-l border-primary" />
                  <div className="absolute left-2/3 top-0 bottom-0 border-l border-primary" />
                  <span className="absolute top-3 left-3 text-[10px] font-mono text-primary font-bold">
                    STRUCTURAL LEVEL -1 BASEMENT BLUEPRINT
                  </span>
                </div>

                <Stage
                  width={stageDimensions.width * zoom}
                  height={stageDimensions.height * zoom}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <Layer>
                    {/* Render Persisted Annotations using Normalized Coordinates */}
                    {annotations.map((ann: any) => {
                      const stageW = stageDimensions.width * zoom;
                      const stageH = stageDimensions.height * zoom;
                      const x = ann.normalizedX * stageW;
                      const y = ann.normalizedY * stageH;
                      const w = (ann.normalizedWidth || 0.1) * stageW;
                      const h = (ann.normalizedHeight || 0.1) * stageH;

                      if (ann.type === 'rect') {
                        return (
                          <React.Fragment key={ann._id}>
                            <Rect
                              x={x}
                              y={y}
                              width={w}
                              height={h}
                              stroke={ann.color || '#C53030'}
                              strokeWidth={2}
                              dash={[6, 4]}
                              fill={`${ann.color || '#C53030'}15`}
                            />
                            <KonvaText
                              x={x + 4}
                              y={y + 4}
                              text={ann.label || 'REV'}
                              fontSize={10}
                              fontStyle="bold"
                              fill={ann.color || '#C53030'}
                            />
                          </React.Fragment>
                        );
                      }

                      if (ann.type === 'marker') {
                        return (
                          <React.Fragment key={ann._id}>
                            <Circle
                              x={x}
                              y={y}
                              radius={8}
                              fill={ann.color || '#C53030'}
                              stroke="#FFFFFF"
                              strokeWidth={1.5}
                            />
                            <KonvaText
                              x={x + 12}
                              y={y - 6}
                              text={ann.comment || ann.label || 'Pin'}
                              fontSize={11}
                              fontStyle="bold"
                              fill="#172B3A"
                            />
                          </React.Fragment>
                        );
                      }

                      return null;
                    })}

                    {/* Render In-Progress Drawing Shape */}
                    {newShape && isDrawing && (
                      <Rect
                        x={newShape.x}
                        y={newShape.y}
                        width={newShape.width}
                        height={newShape.height}
                        stroke={annotationColor}
                        strokeWidth={2}
                        dash={[4, 4]}
                        fill={`${annotationColor}20`}
                      />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </Card>

          {/* Annotations List */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Persisted Drawing Markups ({annotations.length})</CardTitle>
                <CardDescription>
                  Normalized coordinate revision clouds pinned to this blueprint
                </CardDescription>
              </div>
            </CardHeader>

            {annotations.length === 0 ? (
              <p className="text-xs text-text-muted">
                No annotations drawn yet. Select "Revision Box" or "Pin Marker" above and click on the blueprint to mark variations.
              </p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden text-xs">
                {annotations.map((ann: any) => (
                  <div key={ann._id} className="p-3 bg-surface hover:bg-surface-subtle flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: ann.color || '#C53030' }}
                      />
                      <div>
                        <div className="font-semibold text-text-primary">
                          {ann.label} — {ann.comment}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          By: {ann.createdBy?.name || 'Engineer'} • Normalized Coordinates: (X: {ann.normalizedX.toFixed(2)}, Y: {ann.normalizedY.toFixed(2)})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteAnnotationMutation.mutate(ann._id)}
                      className="p-1 text-text-muted hover:text-status-danger rounded transition-colors"
                      title="Delete annotation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Upload Document Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Drawing or Project Document"
        description="Attach PDF blueprints, site verification photos, or contract baseline files"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {uploadError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {uploadError}
            </div>
          )}

          <Select
            label="Target Project"
            required
            value={uploadProjectId}
            onChange={(e) => setUploadProjectId(e.target.value)}
            options={projects.map((p: any) => ({
              value: p._id,
              label: `${p.code} — ${p.name}`,
            }))}
          />

          <Select
            label="Document Category"
            required
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            options={[
              { value: 'Drawing', label: 'Architectural / Structural Blueprint' },
              { value: 'Site Photo', label: 'Site Photographic Evidence' },
              { value: 'Variation Evidence', label: 'Client Instruction / Request Letter' },
              { value: 'Contract', label: 'Contract Baseline Document' },
              { value: 'General', label: 'General Technical Document' },
            ]}
          />

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Select Document File <span className="text-status-danger">*</span>
            </label>
            <input
              type="file"
              required
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-text-primary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary-light file:text-secondary hover:file:bg-teal-100"
            />
          </div>

          <Input
            label="Descriptive Notes (Optional)"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="e.g. Tower B Structural Grid Revisions R2"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={uploadMutation.isPending}
            >
              Upload to Repository
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

