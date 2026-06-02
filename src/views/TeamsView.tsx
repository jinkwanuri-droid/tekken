import React, { useState } from 'react';
import { useTournament } from '../store';
import { Settings, Save, AlertTriangle, FileText, UserPlus, Trash2, PlusCircle, Edit3, Check } from 'lucide-react';
import { Team, Player } from '../types';

export const TeamsView = () => {
  const { state, dispatch } = useTournament();
  
  const [numTeams, setNumTeams] = useState(state.settings.numTeams);
  const [playersPerTeam, setPlayersPerTeam] = useState(state.settings.playersPerTeam);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const handleUpdateSettings = () => {
    const isDestructive = numTeams !== state.settings.numTeams || playersPerTeam !== state.settings.playersPerTeam;
    if (isDestructive) {
      if(confirm('팀 구성을 변경하면 대진표와 진행 히스토리가 완전히 초기화됩니다. 계속하시겠습니까?')) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { numTeams, playersPerTeam } });
      } else {
        // revert local state
        setNumTeams(state.settings.numTeams);
        setPlayersPerTeam(state.settings.playersPerTeam);
      }
    }
  };

  const handleAddTeam = () => {
    if (state.teams.length >= 32) {
      alert('최대 32개 팀까지만 추가할 수 있습니다.');
      return;
    }
    if (confirm('신규 팀을 추가하면 대진표가 초기화됩니다. 추가하시겠습니까?')) {
      dispatch({ type: 'ADD_TEAM' });
    }
  };

  const handleDeleteTeam = (teamId: string, teamName: string) => {
    if (state.teams.length <= 2) {
      alert('최소 2개 팀은 유지되어야 합니다.');
      return;
    }
    if (confirm(`'${teamName}' 팀을 삭제하시겠습니까? 삭제 시 대진표가 초기화됩니다.`)) {
      dispatch({ type: 'DELETE_TEAM', payload: teamId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-canvas/30">
      <header className="p-6 border-b border-hairline bg-surface-1/50 backdrop-blur-md shrink-0">
        <h1 className="text-2xl font-titular text-ink mb-1">팀 및 설정 관리</h1>
        <p className="text-ink-subtle text-sm">토너먼트 참가 기준 및 참가자 명단을 수정합니다.</p>
      </header>

      <div className="flex-1 overflow-auto p-8 scrollbar-hidden translate-z-0 will-change-transform">
        
        {/* Settings Area */}
        <div className="glass-panel p-6 rounded-xl mb-12 border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <Settings className="w-5 h-5" />
            <h2 className="text-lg font-bold">경기 규격 설정</h2>
          </div>
          
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-ink-subtle">대진 진행 방식</label>
              <select 
                className="glass-input w-48 bg-[#0e1217]"
                value={state.settings.matchFormat} 
                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { matchFormat: e.target.value as any } })}
              >
                <option value="hybrid">조별리그 + 토너먼트 (기본)</option>
                <option value="tournament">단일 토너먼트</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm text-ink-subtle">팀 갯수 (N강)</label>
              <input 
                type="number" 
                className="glass-input w-24" 
                value={numTeams} 
                onChange={(e) => setNumTeams(Number(e.target.value))} 
                min={2} 
                max={32}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-ink-subtle">팀당 인원수</label>
              <select className="glass-input w-40" value={playersPerTeam} onChange={(e) => setPlayersPerTeam(Number(e.target.value))}>
                <option value={3}>3명 (Best of 5)</option>
                <option value={6}>6명 (Best of 7)</option>
                <option value={10}>10명 (Best of 11)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-ink-subtle">승자 연전 방식</label>
              <select 
                className="glass-input w-40" 
                value={state.settings.matchType} 
                onChange={(e) => dispatch({ type: 'UPDATE_SETTINGS', payload: { matchType: e.target.value as any } })}
              >
                <option value="winners">위너스 연결 (승자연전)</option>
                <option value="individual">개별 매치 (초기화)</option>
              </select>
            </div>

            <button 
              onClick={handleUpdateSettings} 
              disabled={numTeams === state.settings.numTeams && playersPerTeam === state.settings.playersPerTeam}
              className="glass-button px-6 py-2 rounded-md text-sm font-medium flex items-center gap-2 h-[42px] disabled:opacity-50 disabled:cursor-not-allowed text-primary-hover"
            >
              <Save className="w-4 h-4" />
              변경사항 적용
            </button>
          </div>
          <p className="text-xs text-ink-tertiary mt-4 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 인원 규격 변경 시 전체 대진표가 초기화됩니다. 변경사항 버튼을 눌러야 적용됩니다.
          </p>
        </div>


        {/* Teams List Area */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-titular text-ink">팀명 및 참가자 편집</h2>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${
              isEditMode 
                ? 'bg-primary text-white shadow-[0_0_15px_rgba(225,29,72,0.3)]' 
                : 'bg-surface-2 text-ink-subtle border border-hairline hover:text-white hover:bg-surface-3'
            }`}
          >
            {isEditMode ? (
              <><Check className="w-3 h-3" /> 편집 완료</>
            ) : (
              <><Edit3 className="w-3 h-3" /> 팀 편집 (추가/삭제)</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {isEditMode && (
            <button 
              onClick={handleAddTeam}
              className="group border-2 border-dashed border-hairline rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-ink-tertiary hover:border-primary hover:text-primary transition-all bg-primary/5 hover:bg-primary/10 h-full min-h-[220px]"
            >
              <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary/20 transition-colors">
                <PlusCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-sm font-bold">새로운 팀 추가하기</div>
                <div className="text-[10px] opacity-60">추가 시 대진표가 초기화됩니다</div>
              </div>
            </button>
          )}

          {state.teams.map((team, idx) => (
             <TeamEditor 
               key={team.id} 
               team={team} 
               index={idx} 
               dispatch={dispatch} 
               isEditMode={isEditMode}
               onDelete={() => handleDeleteTeam(team.id, team.name)}
             />
          ))}
        </div>

      </div>
    </div>
  );
};


const TeamEditor: React.FC<{ team: Team; index: number; dispatch: any; isEditMode?: boolean; onDelete?: () => void }> = ({ team, index, dispatch, isEditMode, onDelete }) => {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchText, setBatchText] = useState(`[${team.name}]\n${team.players.map(p => p.name).join('\n')}`);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'UPDATE_TEAM', payload: { teamId: team.id, name: e.target.value } });
  };
  
  const handlePlayerNameChange = (playerId: string, name: string) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: { teamId: team.id, playerId, name } });
  };

  const handleBatchSubmit = () => {
    const lines = batchText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    
    let teamName = team.name;
    let players = [...lines];

    if (lines[0].startsWith('[') && lines[0].endsWith(']')) {
      teamName = lines[0].substring(1, lines[0].length - 1);
      players = lines.slice(1);
    }
    
    dispatch({ type: 'BATCH_UPDATE_TEAM', payload: { teamId: team.id, name: teamName, players } });
    setIsBatchMode(false);
  };

  return (
    <div className={`glass-panel p-6 rounded-xl border-hairline relative transition-all ${isEditMode ? 'ring-2 ring-primary/20 bg-primary/5 border-primary/30' : ''}`}>
       <div className="absolute top-6 right-6 flex items-center gap-3">
         <button 
           onClick={() => setIsBatchMode(!isBatchMode)}
           className="text-ink-subtle hover:text-white transition-colors"
           title="일괄 입력 모드"
         >
           <FileText className="w-4 h-4" />
         </button>
         
         {isEditMode && (
           <button 
             onClick={onDelete}
             className="text-pink-500/60 hover:text-pink-500 transition-colors"
             title="팀 삭제"
           >
             <Trash2 className="w-4 h-4" />
           </button>
         )}
       </div>

       <div className="flex items-center gap-4 mb-6 border-b border-hairline pb-4 pr-8">
         <div className="w-10 h-10 rounded-full bg-surface-2 flex flex-shrink-0 items-center justify-center font-mono text-ink-subtle border border-hairline">
           #{index +1}
         </div>
         <input 
           type="text" 
           value={team.name}
           onChange={handleTeamNameChange}
           className="bg-transparent border-none outline-none text-2xl font-titular text-ink w-full focus:ring-0 p-0"
           placeholder="팀명 입력"
           disabled={isBatchMode}
         />
       </div>

       {isBatchMode ? (
         <div className="flex flex-col gap-3">
           <p className="text-xs text-ink-subtle">팀명은 [이름] 형식으로 첫 줄에 작성하고, 다음 줄부터 선수명을 엔터로 구분하여 입력하세요.</p>
           <textarea 
             className="glass-input min-h-[160px] font-mono text-sm leading-relaxed"
             value={batchText}
             onChange={e => setBatchText(e.target.value)}
             placeholder={`[팀명]\n선수1\n선수2\n선수3`}
           />
           <div className="flex justify-end gap-2 mt-2">
             <button onClick={() => setIsBatchMode(false)} className="glass-button px-4 py-2 text-ink-subtle border-none">취소</button>
             <button onClick={handleBatchSubmit} className="btn-accent px-4 py-2">적용하기</button>
           </div>
         </div>
       ) : (
         <div className="grid grid-cols-3 gap-3">
           {team.players.map((player, pIdx) => (
             <div key={player.id} className="flex items-center gap-2 p-2 rounded-md bg-canvas/40 border border-hairline-tertiary transition-all focus-within:border-primary-focus">
               <span className="text-xs text-ink-tertiary font-mono w-5 mt-0.5">{pIdx + 1}.</span>
               <input 
                 type="text"
                 value={player.name}
                 onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                 className="bg-transparent border-none outline-none text-sm text-ink-muted w-full focus:ring-0 p-0"
                 placeholder="선수명"
               />
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
