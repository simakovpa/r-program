import React, { useState, useMemo } from "react";
import { Layout, Menu, Table, Tag, Card, Row, Col, Statistic, Select, Button, Drawer, Progress, Space, Modal, Form, InputNumber, Divider } from "antd";
import { ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, ClockCircleOutlined, EyeOutlined, PlusOutlined, CalendarOutlined, SettingOutlined, LineChartOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;
const { Option } = Select;

const mockAssets = [
  { id: 1, name: "ВЛ-10 кВ Северная", type: "ВЛ", voltageClass: "10 кВ", commissionedYear: 1985, normativeLifetime: 40, reliabilityCategory: "II", hasSocialObjects: true, defects: [{ id: 1, type: "Износ изоляции", severity: 3, isBlocking: true, date: "2025-03-15" }], tests: [], status: "recommended", inPlan: false },
  { id: 2, name: "ТП-156", type: "ТП", voltageClass: "0.4 кВ", commissionedYear: 1990, normativeLifetime: 30, reliabilityCategory: "III", hasSocialObjects: false, defects: [], tests: [], status: "recommended", inPlan: false },
  { id: 3, name: "КЛ-6 кВ Центральная", type: "КЛ", voltageClass: "6 кВ", commissionedYear: 1978, normativeLifetime: 35, reliabilityCategory: "I", hasSocialObjects: true, defects: [{ id: 4, type: "Повреждение оболочки", severity: 3, isBlocking: false, date: "2025-03-01" }], tests: [], status: "recommended", inPlan: false },
  { id: 4, name: "ПС 110/10 кВ Южная", type: "ПС", voltageClass: "110 кВ", commissionedYear: 1982, normativeLifetime: 45, reliabilityCategory: "I", hasSocialObjects: true, defects: [], tests: [], status: "recommended", inPlan: false },
  { id: 5, name: "КТП-250", type: "КТП", voltageClass: "10 кВ", commissionedYear: 2005, normativeLifetime: 30, reliabilityCategory: "II", hasSocialObjects: false, defects: [], tests: [], status: "recommended", inPlan: false },
  { id: 6, name: "ВЛ-0.4 кВ Дачная", type: "ВЛ", voltageClass: "0.4 кВ", commissionedYear: 1995, normativeLifetime: 30, reliabilityCategory: "III", hasSocialObjects: false, defects: [], tests: [], status: "recommended", inPlan: false },
  { id: 7, name: "ВЛ-35 кВ Промышленная", type: "ВЛ", voltageClass: "35 кВ", commissionedYear: 1975, normativeLifetime: 40, reliabilityCategory: "II", hasSocialObjects: true, defects: [{ id: 8, type: "Дефект изолятора", severity: 3, isBlocking: true, date: "2025-03-20" }], tests: [], status: "recommended", inPlan: false },
  { id: 8, name: "ТП-89", type: "ТП", voltageClass: "0.4 кВ", commissionedYear: 2010, normativeLifetime: 30, reliabilityCategory: "III", hasSocialObjects: false, defects: [], tests: [], status: "recommended", inPlan: false }
];

const defaultScoringConfig = { weightDefects: 0.40, weightWear: 0.25, weightConsequences: 0.20, weightTests: 0.15, defectScoreMax: 30.0, wearOverdueCap: 1.5, thresholdCritical: 7.5, thresholdHigh: 5.0, thresholdMedium: 2.5 };
const defectTypeWeights = { "Износ изоляции": 8.0, "Коррозия опор": 5.0, "Повреждение оболочки": 7.0, "Дефект изолятора": 9.0 };
const severityMultipliers = { 1: 0.5, 2: 1.0, 3: 2.0 };
const voltageBonus = { "220 кВ": 5, "110 кВ": 4, "35 кВ": 3, "6 кВ": 2, "10 кВ": 2, "0.4 кВ": 1 };
const reliabilityBonus = { "I": 4, "II": 2, "III": 1 };

const calculateScore = (asset, config) => {
  const currentYear = 2025;
  let dRaw = 0;
  asset.defects.forEach(defect => { dRaw += (defectTypeWeights[defect.type] || 5.0) * (severityMultipliers[defect.severity] || 1.0); });
  const dNorm = Math.min(dRaw / config.defectScoreMax, 1.0) * 10;
  const age = currentYear - asset.commissionedYear;
  const wearRatio = age / asset.normativeLifetime;
  const wNorm = Math.min(wearRatio / config.wearOverdueCap, 1.0) * 10;
  const cRaw = (voltageBonus[asset.voltageClass] || 1) + (reliabilityBonus[asset.reliabilityCategory] || 1) + (asset.hasSocialObjects ? 2 : 0);
  const cNorm = Math.min(cRaw / 11, 1.0) * 10;
  const tNorm = 0;
  const totalScore = config.weightDefects * dNorm + config.weightWear * wNorm + config.weightConsequences * cNorm + config.weightTests * tNorm;
  let priorityCategory = totalScore >= config.thresholdCritical ? "critical" : totalScore >= config.thresholdHigh ? "high" : totalScore >= config.thresholdMedium ? "medium" : "low";
  if (asset.defects.some(d => d.isBlocking)) priorityCategory = "critical";
  const wearPercent = Math.min(wearRatio * 100, 100);
  const maxSeverity = asset.defects.length > 0 ? Math.max(...asset.defects.map(d => d.severity)) : 0;
  let repairRecommendation = "ТО", repairReason = "Плановые регламентные работы";
  if (maxSeverity === 3 && wearPercent >= 70) { repairRecommendation = "КР"; repairReason = "Дефект критической степени при износе ≥70%"; }
  else if (maxSeverity === 3 && wearPercent < 70) { repairRecommendation = "ТР"; repairReason = "Устранение конкретного дефекта"; }
  return { scoreDefects: dNorm, scoreWear: wNorm, scoreConsequences: cNorm, scoreTests: tNorm, totalScore: Math.round(totalScore * 100) / 100, priorityCategory, hasBlockingDefect: asset.defects.some(d => d.isBlocking), wearPercent: Math.round(wearPercent), repairRecommendation, repairReason, criticalDefectsCount: asset.defects.filter(d => d.severity === 3).length };
};

const riskMatrixZones = [["low", "low", "low", "medium", "medium"], ["low", "low", "medium", "medium", "high"], ["low", "medium", "medium", "high", "high"], ["medium", "medium", "high", "high", "critical"], ["medium", "high", "high", "critical", "critical"]];
const zoneColors = { low: "#52c41a", medium: "#faad14", high: "#ff7a45", critical: "#f5222d" };
const zoneLabels = { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критичный" };
const priorityColors = { critical: "#f5222d", high: "#ff7a45", medium: "#faad14", low: "#52c41a" };
const priorityLabels = { critical: "Критичный", high: "Высокий", medium: "Средний", low: "Низкий" };

const App = () => {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedAssetTypes, setSelectedAssetTypes] = useState([]);
  const [selectedVoltageClasses, setSelectedVoltageClasses] = useState([]);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedMatrixZone, setSelectedMatrixZone] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [postponeModalVisible, setPostponeModalVisible] = useState(false);
  const [assets, setAssets] = useState(mockAssets);
  const [scoringConfig] = useState(defaultScoringConfig);

  const scoredAssets = useMemo(() => assets.map(asset => ({ ...asset, scoring: calculateScore(asset, scoringConfig) })), [assets, scoringConfig]);
  const filteredAssets = useMemo(() => scoredAssets.sort((a, b) => b.scoring.totalScore - a.scoring.totalScore), [scoredAssets]);
  const stats = useMemo(() => { const counts = { critical: 0, high: 0, medium: 0, low: 0, inPlan: 0 }; scoredAssets.forEach(asset => { counts[asset.scoring.priorityCategory]++; if (asset.inPlan) counts.inPlan++; }); return counts; }, [scoredAssets]);

  const handleAddToPlan = (assetId) => { setAssets(prev => prev.map(a => a.id === assetId ? { ...a, inPlan: true, status: "inPlan" } : a)); setDrawerVisible(false); };
  const handlePostponeSubmit = (values) => { if (selectedAsset) { setAssets(prev => prev.map(a => a.id === selectedAsset.id ? { ...a, status: "postponed" } : a)); } setPostponeModalVisible(false); setDrawerVisible(false); };

  const columns = [
    { title: "Наименование", dataIndex: "name", key: "name", render: (text, record) => (<div><div style={{ fontWeight: 500 }}>{text}</div>{record.scoring.hasBlockingDefect && (<Tag color="red" icon={<WarningOutlined />}>Блокирующий</Tag>)}</div>) },
    { title: "Тип / Напряжение", key: "type_voltage", render: (_, record) => (<Space><Tag>{record.type}</Tag><Tag color="blue">{record.voltageClass}</Tag></Space>) },
    { title: "Балл", dataIndex: ["scoring", "totalScore"], key: "totalScore", render: (score) => (<Progress type="line" percent={score * 10} strokeColor={priorityColors[record.scoring.priorityCategory]} format={() => score.toFixed(1)} size="small" style={{ width: 80 }} />) },
    { title: "Категория", dataIndex: ["scoring", "priorityCategory"], key: "priorityCategory", render: (category) => (<Tag color={priorityColors[category]}>{priorityLabels[category]}</Tag>) },
    { title: "Износ", dataIndex: ["scoring", "wearPercent"], key: "wearPercent", render: (p) => (<Progress type="circle" percent={p} strokeColor={p >= 80 ? "#f5222d" : "#52c41a"} size={40} format={() => `${p}%`} />) },
    { title: "Действие", key: "action", render: (_, record) => (<Space><Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); handleAddToPlan(record.id); }}>В план</Button><Button size="small" onClick={(e) => { e.stopPropagation(); setSelectedAsset(record); setDrawerVisible(true); }}>Детали</Button></Space>) }
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} theme="dark">
        <div style={{ padding: 16, color: "#fff", fontSize: 16, fontWeight: "bold" }}><ThunderboltOutlined /> Ремонтная программа</div>
        <Menu theme="dark" mode="inline" selectedKeys={["recommendations"]}>
          <Menu.Item key="recommendations" icon={<LineChartOutlined />}>Рекомендации</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 24px", display: "flex", alignItems: "center" }}><h2 style={{ margin: 0, fontSize: 20 }}>Модуль приоритизации объектов</h2></Header>
        <Content style={{ padding: 24, background: "#f0f2f5" }}>
          <Card style={{ marginBottom: 16 }}>
            <Space wrap><Select style={{ width: 120 }} value={selectedYear} onChange={setSelectedYear} options={[{ value: "2025", label: "2025" }]} /><Select mode="multiple" style={{ width: 200 }} placeholder="Тип актива" value={selectedAssetTypes} onChange={setSelectedAssetTypes} options={[{ value: "ВЛ", label: "ВЛ" }, { value: "ТП", label: "ТП" }, { value: "КЛ", label: "КЛ" }]} /><Select style={{ width: 150 }} value={selectedPriority} onChange={setSelectedPriority} options={[{ value: "all", label: "Все" }, { value: "critical", label: "Критичный" }, { value: "high", label: "Высокий" }]} /></Space>
          </Card>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}><Card><Statistic title="Критичный" value={stats.critical} valueStyle={{ color: "#f5222d" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="Высокий" value={stats.high} valueStyle={{ color: "#ff7a45" }} /></Card></Col>
            <Col span={6}><Card><Statistic title="В плане" value={stats.inPlan} valueStyle={{ color: "#52c41a" }} /></Card></Col>
          </Row>
          <Card title={`Объекты (${filteredAssets.length})`}><Table columns={columns} dataSource={filteredAssets} rowKey="id" pagination={{ pageSize: 10 }} /></Card>
        </Content>
      </Layout>
      <Drawer title={selectedAsset?.name} placement="right" width={400} onClose={() => setDrawerVisible(false)} open={drawerVisible}>
        {selectedAsset && (<><Card size="small" style={{ marginBottom: 16 }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>Балл:</span><strong style={{ color: priorityColors[selectedAsset.scoring.priorityCategory] }}>{selectedAsset.scoring.totalScore}</strong></div><Tag color={priorityColors[selectedAsset.scoring.priorityCategory]}>{priorityLabels[selectedAsset.scoring.priorityCategory]}</Tag></Card><Card title="Декомпозиция" size="small"><Progress percent={selectedAsset.scoring.scoreDefects * 10} strokeColor="#f5222d" format={() => `D: ${selectedAsset.scoring.scoreDefects.toFixed(1)}`} /><Progress percent={selectedAsset.scoring.scoreWear * 10} strokeColor="#faad14" format={() => `W: ${selectedAsset.scoring.scoreWear.toFixed(1)}`} /><Progress percent={selectedAsset.scoring.scoreConsequences * 10} strokeColor="#1890ff" format={() => `C: ${selectedAsset.scoring.scoreConsequences.toFixed(1)}`} /></Card><Card title="Рекомендация" size="small" style={{ marginTop: 16 }}><Tag color="blue">{selectedAsset.scoring.repairRecommendation}</Tag><div style={{ fontSize: 12, marginTop: 8 }}>{selectedAsset.scoring.repairReason}</div></Card><Divider /><Button type="primary" block onClick={() => handleAddToPlan(selectedAsset.id)}>В план {selectedYear}</Button></>)}
      </Drawer>
    </Layout>
  );
};

export default App;
