import React, { useState } from 'react';
import { useChatContext } from 'stream-chat-react';
import { UserList } from './';
import { CloseCreateChannel } from '../assets';

const ChannelNameInput = ({ channelName = '', setChannelName, disabled }) => {
  const handleChange = (e) => {
    if (!disabled) setChannelName(e.target.value);
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Channel Name</label>
      <input
        value={channelName}
        onChange={handleChange}
        placeholder="Enter channel name"
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 10px',
          fontSize: '14px',
          borderRadius: 6,
          border: '1px solid #ccc',
          backgroundColor: disabled ? '#f3f3f3' : '#fff',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
};

const EditChannel = ({ setIsEditing }) => {
  const { client, channel, setActiveChannel } = useChatContext();
  const [channelName, setChannelName] = useState(channel?.data?.name || '');
  const [usersToAdd, setUsersToAdd] = useState([]);
  const [usersToRemove, setUsersToRemove] = useState([]);

  const currentMembers = Object.values(channel?.state?.members || {});
  const channelCreatorId = channel?.data?.created_by?.id || channel?.data?.created_by;
  const isCreator = client.userID === channelCreatorId;
  const isCurrentUserLeaving = usersToRemove.includes(client.userID);

  const updateChannel = async (e) => {
    e.preventDefault();

    if (!isCreator && usersToAdd.length > 0) return alert('Only the creator can add members.');
    if (!isCreator && usersToRemove.some(id => id !== client.userID)) return alert('You cannot remove others.');

    const nameChanged = channelName !== (channel.data.name || channel.data.id);

    try {
      if (isCreator && nameChanged) {
        await channel.update({ name: channelName }, { text: `Channel renamed to ${channelName}` });
      }

      if (isCreator && usersToAdd.length) {
        await channel.addMembers(usersToAdd);
      }

      if (usersToRemove.length) {
        await channel.removeMembers(usersToRemove);
        if (isCurrentUserLeaving) setActiveChannel(null);
      }

      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const deleteChannel = async () => {
    if (!isCreator) return alert('Only the creator can delete the channel.');
    try {
      await channel.delete();
      setIsEditing(false);
      setActiveChannel(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div
      style={{
        maxWidth: 480,
        height: '90vh',
        margin: '0 auto',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Edit Channel</h2>
        <CloseCreateChannel setIsEditing={setIsEditing} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 6 }}>
        <ChannelNameInput
          channelName={channelName}
          setChannelName={setChannelName}
          disabled={!isCreator}
        />

        {isCreator && <UserList setSelectedUsers={setUsersToAdd} />}

        <div style={{ marginTop: 20 }}>
          <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
            Current Members
          </label>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              maxHeight: 200,
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: 6,
            }}
          >
            {currentMembers.map(({ user }) => {
              const isYou = user.id === client.userID;
              const isToRemove = usersToRemove.includes(user.id);

              return (
                <li
                  key={user.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderBottom: '1px solid #eee',
                    fontSize: 14,
                  }}
                >
                  <span>
                    {user.name || user.id}
                    {isYou && ' (You)'}
                    {user.id === channelCreatorId && ' [Creator]'}
                  </span>

                  {isYou ? (
                    <button
                      onClick={() =>
                        setUsersToRemove(prev =>
                          isToRemove ? prev.filter(id => id !== user.id) : [...prev, user.id]
                        )
                      }
                      style={{
                        backgroundColor: isToRemove ? '#999' : '#e53935',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {isToRemove ? 'Cancel' : 'Leave'}
                    </button>
                  ) : isCreator ? (
                    <button
                      onClick={() =>
                        setUsersToRemove(prev =>
                          isToRemove ? prev.filter(id => id !== user.id) : [...prev, user.id]
                        )
                      }
                      style={{
                        backgroundColor: isToRemove ? '#777' : '#bbb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {isToRemove ? 'Undo' : 'Remove'}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={updateChannel}
          style={{
            backgroundColor: '#4caf50',
            color: '#fff',
            padding: '10px',
            width: '100%',
            fontWeight: 600,
            fontSize: 15,
            borderRadius: 6,
            border: 'none',
            marginBottom: 10,
            cursor: 'pointer',
          }}
        >
          Save Changes
        </button>

        {isCreator && (
          <button
            onClick={deleteChannel}
            style={{
              backgroundColor: '#f44336',
              color: '#fff',
              padding: '10px',
              width: '100%',
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Delete Channel
          </button>
        )}
      </div>
    </div>
  );
};

export default EditChannel;
