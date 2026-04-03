import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spin, Card, Typography, Empty, Tag, Button, Space, Modal, Descriptions, Image } from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const ManpowerApplication = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await axios.get("https://masterbuilder-backend.onrender.com/api/manpower/apply");
            if (response.data.success) {
                setApplications(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching manpower applications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const showDetails = (record) => {
        setSelectedApp(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 70,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Skill",
            dataIndex: "skill",
            key: "skill",
            render: (text) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Email",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "Phone",
            dataIndex: "mobilenumber",
            key: "mobilenumber",
        },
        {
            title: "Workers",
            dataIndex: "no_of_workers",
            key: "no_of_workers",
            sorter: (a, b) => a.no_of_workers - b.no_of_workers,
        },
        {
            title: "City",
            dataIndex: "city",
            key: "city",
        },
        {
            title: "Date",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Button 
                    type="primary" 
                    icon={<EyeOutlined />} 
                    onClick={() => showDetails(record)}
                    style={{ backgroundColor: "#ffc400", borderColor: "#ffc400", color: "#000" }}
                >
                    View
                </Button>
            ),
        }
    ];

    return (
        <div className="page" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <Title level={2}>Manpower Applications</Title>
                <Button 
                    type="primary" 
                    icon={<ReloadOutlined />} 
                    onClick={fetchApplications}
                    style={{ borderRadius: "8px", backgroundColor: "#000", borderColor: "#000", color: "#ffc400" }}
                >
                    Refresh
                </Button>
            </div>

            <Card style={{ borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "50px" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: "10px" }}>Loading Applications...</div>
                    </div>
                ) : applications.length > 0 ? (
                    <Table 
                        columns={columns} 
                        dataSource={applications} 
                        rowKey="id" 
                        pagination={{ pageSize: 10 }}
                        style={{ background: "#fff" }}
                    />
                ) : (
                    <Empty description="No applications found" />
                )}
            </Card>

            <Modal
                title={`Application Details - ID: ${selectedApp?.id}`}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key="close" onClick={handleCancel} style={{ borderRadius: "8px" }}>
                        Close
                    </Button>
                ]}
                width={800}
            >
                {selectedApp && (
                    <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Skill" span={2}>
                                <Tag color="gold">{selectedApp.skill}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Full Name">User ID: {selectedApp.userid}</Descriptions.Item>
                            <Descriptions.Item label="Email">{selectedApp.email}</Descriptions.Item>
                            <Descriptions.Item label="Mobile">{selectedApp.mobilenumber}</Descriptions.Item>
                            <Descriptions.Item label="DOB">{selectedApp.dob}</Descriptions.Item>
                            <Descriptions.Item label="Gender">{selectedApp.gender}</Descriptions.Item>
                            <Descriptions.Item label="Workers">{selectedApp.no_of_workers}</Descriptions.Item>
                            <Descriptions.Item label="Days Needed">{selectedApp.no_of_days}</Descriptions.Item>
                            <Descriptions.Item label="Address" span={2}>
                                {selectedApp.addressline1}, {selectedApp.addressline2}, {selectedApp.city}, {selectedApp.pincode}
                            </Descriptions.Item>
                            <Descriptions.Item label="Description" span={2}>
                                {selectedApp.description}
                            </Descriptions.Item>
                        </Descriptions>

                        {selectedApp.manpowerDetail && (
                            <div style={{ marginTop: "20px" }}>
                                <Title level={4}>Applied for Manpower Service:</Title>
                                <Card style={{ background: "#f9f9f9" }}>
                                    <div style={{ display: "flex", gap: "20px" }}>
                                        <Image
                                            width={100}
                                            height={100}
                                            src={selectedApp.manpowerDetail.profileUrl}
                                            style={{ borderRadius: "8px", objectFit: "cover" }}
                                        />
                                        <div>
                                            <Title level={5}>{selectedApp.manpowerDetail.title}</Title>
                                            <Text type="secondary">{selectedApp.manpowerDetail.location}</Text>
                                            <div style={{ marginTop: "5px" }}>
                                                <Tag color="green">Rating: {selectedApp.manpowerDetail.services?.manualRating || 0}</Tag>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "15px" }}>
                                        <Text strong>About the Service Provider:</Text>
                                        <p style={{ marginTop: "5px", color: "#666" }}>{selectedApp.manpowerDetail.aboutUs.substring(0, 200)}...</p>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ManpowerApplication;
