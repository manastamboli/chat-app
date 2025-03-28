import { useAuthStore } from "../store/useAuthStore";

function ChatRequests() {
    const { chatRequests, respondToChatRequest } = useAuthStore();
    
    console.log("Current chat requests:", chatRequests); // Debug log
    
    // If no requests, show a message
    if (!chatRequests || chatRequests.length === 0) {
        return (
            <div className="chat-requests-container">
                <h3>Chat Requests</h3>
                <p>No pending chat requests</p>
            </div>
        );
    }
  
    return (
        <div className="chat-requests-container">
            <h3>Chat Requests</h3>
            {chatRequests.map(request => (
                <div key={request._id} className="request-card">
                    <p>Request from: {request.senderInfo?.username}</p>
                    <div className="request-buttons">
                        <button 
                            className="accept-button"
                            onClick={() => respondToChatRequest(request._id, 'accepted')}
                        >
                            Accept
                        </button>
                        <button 
                            className="reject-button"
                            onClick={() => respondToChatRequest(request._id, 'rejected')}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default ChatRequests;