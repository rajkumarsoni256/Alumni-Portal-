import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AlumniProfileModal } from '../profile/AlumniProfileModal';
import { UserAvatar } from '../common/UserAvatar';

export const PersonCard = ({ person }) => {
  const { toggleConnectUser, myConnections } = useApp();
  const [localStatus, setLocalStatus] = useState(person?.connectionStatus || 'none');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    let status = person?.connectionStatus || 'none';
    const targetIdStr = String(person?.id || person?.userId || person?.user_id || '').toLowerCase();
    const targetNameStr = String(person?.name || person?.fullName || '').trim().toLowerCase();

    if (myConnections && myConnections.length > 0) {
      const isAlreadyConnected = myConnections.some(c => {
        const cId = String(c.id || c.userId || c.user_id || '').toLowerCase();
        const cName = String(c.name || c.fullName || '').trim().toLowerCase();
        return (
          (targetIdStr && cId && targetIdStr === cId) ||
          (targetNameStr && cName && targetNameStr === cName)
        );
      });
      if (isAlreadyConnected) {
        status = 'connected';
      }
    }
    setLocalStatus(status);
  }, [person?.connectionStatus, person?.id, person?.userId, person?.name, person?.fullName, myConnections]);

  if (!person) return null;

  const isConnected = localStatus === 'connected' || localStatus === 'CONNECTED';
  const isPending = localStatus === 'pending' || localStatus === 'pending_outgoing' || localStatus === 'PENDING_OUTGOING';
  const isAlumni = Boolean(person.isAlumni || person.role?.toLowerCase() === 'alumni');

  const profilePath = `/alumni/${person.id}`;

  const handleConnectClick = async () => {
    if (isConnected || isPending) return;
    setLocalStatus('pending_outgoing');
    const res = await toggleConnectUser(person.id);
    if (!res) {
      setLocalStatus(person?.connectionStatus || 'none');
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3.5 group">
        
        {/* Top Header: Avatar + Main Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            {/* Avatar with Status */}
            <div 
              onClick={() => setShowModal(true)} 
              className="relative shrink-0 cursor-pointer"
            >
              <UserAvatar
                src={person.avatar}
                name={person.name}
                className="w-12 h-12 group-hover:ring-2 group-hover:ring-red-600/20 transition-all"
              />
              {isAlumni && (
                <span 
                  className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"
                  title="Verified Alumni"
                />
              )}
            </div>

            {/* Identity & Role Info */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-sm font-bold text-slate-900 hover:text-red-700 hover:underline truncate block text-left cursor-pointer"
                >
                  {person.name}
                </button>
                
                {/* Subtle Role Badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                    isAlumni
                      ? 'bg-rose-100 text-red-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isAlumni ? 'Alumni' : 'Student'}
                </span>
              </div>

              {/* Headline / Current Role */}
              <p className="text-xs text-slate-700 font-medium line-clamp-1 leading-snug">
                {person.headline || person.currentRole || (isAlumni ? `Alumni @ ${person.company}` : 'JECRC Student')}
              </p>

              {/* Batch & Department Info */}
              <p className="text-[11px] text-slate-500 truncate">
                {person.batchDisplay || (person.batch ? `JECRC ${person.branch || 'Engineering'} • ${person.batch}` : `JECRC ${person.branch || 'Student'}`)}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{person.location || 'Jaipur, India'}</span>
            </div>
          </div>

          {/* Skills Tag Row */}
          {person.skills && person.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {person.skills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-medium bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded"
                >
                  {skill}
                </span>
              ))}
              {person.skills.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{person.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dual Action Row: View Profile Modal + Connect */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="text-center py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            View Profile
          </button>

          <button
            type="button"
            onClick={handleConnectClick}
            className={`text-center py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
              isConnected
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : isPending
                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                : 'bg-red-700 text-white hover:bg-red-800'
            }`}
          >
            {isConnected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Connected</span>
              </>
            ) : isPending ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Request Sent</span>
              </>
            ) : (
              <span>Connect</span>
            )}
          </button>
        </div>

      </div>

      {/* Alumni Profile Modal matching Image 4 */}
      <AlumniProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        alumni={person}
      />
    </>
  );
};
