import React from 'react';

const GroupList = ({ 
  groups, 
  onGroupClick, 
  onJoinGroup, 
  onAcceptInvite, 
  onRejectInvite,
  showTitle = true,
  className = ""
}) => {
  return (
    <div className={`group-contacts ${className}`}>
      {showTitle && <h3>groups</h3>}
      <ul>
        {groups?.map(group => (
          <li key={group.ID}>
            {group.IsCreator ? (
              <div onClick={() => onGroupClick(group.ID)} className="group-item clickable">
                <strong>{group.Title}</strong><br />
                <small>{group.Description}</small><br />
                <span style={{ fontSize: '12px', color: 'gray' }}>You are the admin</span>
              </div>
            ) : group.IsMember ? (
              <div onClick={() => onGroupClick(group.ID)} className="group-item clickable">
                <strong>{group.Title}</strong><br />
                <small>{group.Description}</small><br />
                <span style={{ color: 'green', fontWeight: 'bold', marginTop: '5px', display: 'inline-block' }}>
                  You are a member of this group
                </span>
              </div>
            ) : group.IsRequested ? (
              <div className="group-item">
                <strong>{group.Title}</strong><br />
                <small>{group.Description}</small><br />
                <span style={{ color: 'orange', fontStyle: 'italic', marginTop: '5px', display: 'inline-block' }}>
                  Your request is pending
                </span>
              </div>
            ) : group.IsInvited ? (
              <div className="group-item">
                <strong>{group.Title}</strong><br />
                <small>{group.Description}</small><br />
                <div style={{ display: 'inline', marginTop: '5px' }}>
                  <button onClick={() => onAcceptInvite(group.ID)}>Accept</button>
                  <button onClick={() => onRejectInvite(group.ID)}>Reject</button>
                </div>
              </div>
            ) : (
              <div className="group-item">
                <strong>{group.Title}</strong><br />
                <small>{group.Description}</small><br />
                <div style={{ marginTop: '5px' }}>
                  <button onClick={() => onJoinGroup(group.ID)}>Join</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GroupList;