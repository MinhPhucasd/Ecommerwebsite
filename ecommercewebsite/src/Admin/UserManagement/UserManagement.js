    // ecommercewebsite/src/Admin/UserManagement/UserManagement.js
import React, { useState, useEffect, useCallback } from 'react';
import { adminFetchUsers, adminUpdateUserAPI } from '../../services/api';
import './UserManagement.css'; // Tạo file CSS

const ROLES = ['user', 'admin'];
const STATUSES = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
];


function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');


    const loadUsers = useCallback(async (page = 1) => {
        setLoading(true);
        setError('');
        try {
            const params = { page, limit: 10 };
            if (searchTerm) params.search = searchTerm;
            if (roleFilter) params.role = roleFilter;

            const response = await adminFetchUsers(params);
            if (response.data.success) {
                setUsers(response.data.data);
                setPagination(response.data.pagination);
                setCurrentPage(response.data.pagination?.currentPage || 1);
            } else {
                setError(response.data.message || "Failed to load users.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "An error occurred.");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, roleFilter]);

    useEffect(() => {
        loadUsers(currentPage);
    }, [loadUsers, currentPage]);

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Change role for user ${userId.slice(-6)} to "${newRole}"?`)) return;
        try {
            await adminUpdateUserAPI(userId, { role: newRole });
            alert('User role updated successfully.');
            loadUsers(currentPage);
        } catch (err) {
            alert(`Failed to update role: ${err.response?.data?.message || err.message}`);
        }
    };
    
    // Giả sử bạn có trường isActive trong model User
    const handleStatusChange = async (userId, newStatus) => {
         if (!window.confirm(`Change status for user ${userId.slice(-6)} to "${newStatus ? 'Active' : 'Inactive'}"?`)) return;
        try {
            await adminUpdateUserAPI(userId, { isActive: newStatus });
            alert('User status updated successfully.');
            loadUsers(currentPage);
        } catch (err) {
            alert(`Failed to update status: ${err.response?.data?.message || err.message}`);
        }
    };


    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        loadUsers(1);
    };
    
    const handlePageChange = (newPage) => {
        if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };


    if (loading && users.length === 0) return <div className="user-management-container">Loading users...</div>;
    if (error) return <div className="user-management-container" style={{color: 'red'}}>Error: {error}</div>;

    return (
        <div className="user-management-container">
            <h1 className="user-management-title">User Management</h1>

            <form onSubmit={handleSearchSubmit} className="user-filter-form">
                <input
                    type="text"
                    placeholder="Search by Email or Name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="user-search-input"
                />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="user-role-filter">
                    <option value="">All Roles</option>
                    {ROLES.map(role => <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
                </select>
                <button type="submit" className="user-search-button">Search</button>
            </form>

            {loading && <p>Loading...</p>}
            {!loading && users.length === 0 && <p>No users found.</p>}

            {users.length > 0 && (
                <>
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            className="user-role-select"
                                            disabled={user.email === 'admin@yourshop.com'} // Ví dụ: không cho đổi role của super admin
                                        >
                                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </td>
                                    <td>
                                        <select
                                            value={user.isActive === undefined ? true : user.isActive} // Mặc định là active nếu trường không tồn tại
                                            onChange={(e) => handleStatusChange(user._id, e.target.value === 'true')}
                                            className="user-status-select"
                                            disabled={user.email === 'admin@yourshop.com'}
                                        >
                                             {STATUSES.map(s => <option key={String(s.value)} value={String(s.value)}>{s.label}</option>)}
                                        </select>
                                        {/* {user.isActive === undefined || user.isActive ? 'Active' : 'Inactive'} */}
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        {/* <button className="action-btn view-btn">View</button> */}
                                        {/* Thêm nút xóa nếu cần */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pagination && pagination.totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>Previous</button>
                            <span> Page {currentPage} of {pagination.totalPages} ({pagination.totalUsers} users) </span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.totalPages || loading}>Next</button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
export default UserManagement;