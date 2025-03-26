import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from 'react';
import './UsersList.css';

function UsersList() {
    const { users, getUsers } = useChatStore();
    const { onlineUsers, authUser, sendChatRequest, acceptedRequests } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("users from userslist", users);
        const fetchUsers = async () => {
            try {
                setLoading(true);
                await getUsers();
            } catch (err) {
                setError(err.message);
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [getUsers]);

    const canChatWith = (userId) => {
        return acceptedRequests?.some(
            chat => 
                (chat.sender._id === userId && chat.receiver._id === authUser._id) ||
                (chat.receiver._id === userId && chat.sender._id === authUser._id)
        );
    };

    const handleChatRequest = (userId) => {
        sendChatRequest(userId);
    };

    const openChat = (userId) => {
        // Implement your chat opening logic here
        console.log("Opening chat with user:", userId);
    };

    if (loading) return <div>Loading users...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!users?.length) return <div>No users found</div>;

    return (
        <div className="users-list-container">
            <h1>Users List</h1>
            
            <div className="users-grid">
                {users.map(user => {
                    // Don't show current user in the list
                    if (user._id === authUser?._id) return null;

                    return (
                        <div key={user._id} className="user-card">
                            <div className="user-info">
                                <span>{user.username}</span>
                                <span className={`status ${onlineUsers.includes(user._id) ? 'online' : 'offline'}`}>
                                    {onlineUsers.includes(user._id) ? '🟢 Online' : '⚫ Offline'}
                                </span>
                            </div>
                            
                            {!canChatWith(user._id) ? (
                                <button 
                                    onClick={() => handleChatRequest(user._id)}
                                    className="request-button"
                                >
                                    Request Chat
                                </button>
                            ) : (
                                <button 
                                    onClick={() => openChat(user._id)}
                                    className="chat-button"
                                >
                                    Open Chat
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default UsersList;