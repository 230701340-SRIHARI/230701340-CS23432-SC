import React, { useState } from 'react';
import {
  MessageList,
  MessageInput,
  Thread,
  Window,
  useChannelActionContext,
  Avatar,
  useChannelStateContext,
  useChatContext,
} from 'stream-chat-react';

import { ChannelInfo } from '../assets';

export const GiphyContext = React.createContext({});

const ChannelInner = ({ setIsEditing }) => {
  const [giphyState, setGiphyState] = useState(false);
  const { sendMessage } = useChannelActionContext();

  // Track current input length
  const [textLength, setTextLength] = useState(0);

  const overrideSubmitHandler = (message) => {
    if (message.text.length > 160) {
      alert('Message cannot be more than 160 characters');
      return; // Prevent sending
    }

    let updatedMessage = {
      attachments: message.attachments,
      mentioned_users: message.mentioned_users,
      parent_id: message.parent?.id,
      parent: message.parent,
      text: message.text,
    };

    if (giphyState) {
      updatedMessage = { ...updatedMessage, text: `/giphy ${message.text}` };
    }

    if (sendMessage) {
      sendMessage(updatedMessage);
      setGiphyState(false);
      setTextLength(0); // Reset count after sending
    }
  };

  return (
    <GiphyContext.Provider value={{ giphyState, setGiphyState }}>
      <div style={{ display: 'flex', width: '100%' }}>
        <Window>
          <TeamChannelHeader setIsEditing={setIsEditing} />
          <MessageList />
          <div style={{ position: 'relative' }}>
            <MessageInput
              overrideSubmitHandler={overrideSubmitHandler}
              onChange={(event) => {
                setTextLength(event.message.text.length);
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                fontSize: 12,
                color: textLength > 160 ? 'red' : '#999',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {textLength} / 160
            </div>
          </div>
        </Window>
        <Thread />
      </div>
    </GiphyContext.Provider>
  );
};

const TeamChannelHeader = ({ setIsEditing }) => {
  const { channel, watcher_count } = useChannelStateContext();
  const { client } = useChatContext();

  const MessagingHeader = () => {
    const members = Object.values(channel.state.members).filter(
      ({ user }) => user.id !== client.userID
    );
    const additionalMembers = members.length - 3;

    if (channel.type === 'messaging') {
      return (
        <div className="team-channel-header__name-wrapper">
          {members.map(({ user }, i) => (
            <div key={i} className="team-channel-header__name-multi">
              <Avatar image={user.image} name={user.fullName || user.id} size={32} />
              <p className="team-channel-header__name user">{user.fullName || user.id}</p>
            </div>
          ))}

          {additionalMembers > 0 && <p className="team-channel-header__name user">and {additionalMembers} more</p>}
        </div>
      );
    }

    return (
      <div className="team-channel-header__channel-wrapper">
        <p className="team-channel-header__name"># {channel.data.name}</p>
        <span style={{ display: 'flex' }} onClick={() => setIsEditing(true)}>
          <ChannelInfo />
        </span>
      </div>
    );
  };

  const getWatcherText = (watchers) => {
    if (!watchers) return 'No users online';
    if (watchers === 1) return '1 user online';
    return `${watchers} users online`;
  };

  return (
    <div className="team-channel-header__container">
      <MessagingHeader />
      <div className="team-channel-header__right">
        <p className="team-channel-header__right-text">{getWatcherText(watcher_count)}</p>
      </div>
    </div>
  );
};

export default ChannelInner;
