import React, { useState, useEffect } from 'react';
import { Trophy, Users, RefreshCw, ChevronRight, Minus, Plus, Grid, GitMerge, ArrowLeft, Trash2, PlusCircle, AlertCircle } from 'lucide-react';

// --- 自定義確認對話框 (解決原生 confirm 可能失效的問題) ---
const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-2 rounded-full text-red-600">
                <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">確認操作</h3>
        </div>
        <p className="text-gray-600 mb-6 pl-1">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            取消
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium shadow-sm"
          >
            確定執行
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 通用組件：比分控制器 ---
const ScoreControl = ({ score, onChange, readOnly, colorClass }) => {
  const currentScore = score === '' ? 0 : parseInt(score);

  const handleDecrease = () => {
    if (readOnly) return;
    onChange(Math.max(0, currentScore - 1));
  };

  const handleIncrease = () => {
    if (readOnly) return;
    onChange(currentScore + 1);
  };

  return (
    <div className="flex items-center gap-1">
      {!readOnly && (
        <button 
          onClick={handleDecrease}
          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-l-md transition-colors active:bg-gray-300"
        >
          <Minus size={14} />
        </button>
      )}
      
      <div className={`h-8 min-w-[3rem] flex items-center justify-center font-mono text-lg font-bold border-y border-gray-200 bg-white ${colorClass} ${readOnly ? 'rounded-md border-x px-2' : ''}`}>
        {score === '' ? '-' : score}
      </div>

      {!readOnly && (
        <button 
          onClick={handleIncrease}
          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-r-md transition-colors active:bg-blue-200"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};

// --- SVG 多邊形視覺化組件 ---
const RoundRobinPolygon = ({ group }) => {
  const numPlayers = group.players.length;
  // 半徑加大以撐開圖形
  const radius = 130; 
  const centerX = 150;
  const centerY = 150;

  // 計算頂點座標
  const getCoordinates = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // -90度讓第一個點在正上方
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const playerCoords = group.players.map((_, i) => getCoordinates(i, numPlayers));

  return (
    <div className="flex justify-center items-center py-6 pointer-events-none">
      {/* 畫布尺寸放大以容納更大的半徑與文字 */}
      <svg width="480" height="480" viewBox="0 0 300 300" className="pointer-events-auto">
        {/* 繪製連線 (Matches) */}
        {group.matches.map((match) => {
          const p1 = playerCoords[match.p1Index];
          const p2 = playerCoords[match.p2Index];
          const hasScore = match.s1 !== '' && match.s2 !== '';
          
          // 計算連線向量
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;

          // 計算顯示位置
          const t1 = 0.32; 
          const t2 = 0.68;
          
          const s1Pos = { x: p1.x + dx * t1, y: p1.y + dy * t1 };
          const s2Pos = { x: p1.x + dx * t2, y: p1.y + dy * t2 };

          return (
            <g key={match.id}>
              {/* 連線 */}
              <line 
                x1={p1.x} y1={p1.y} 
                x2={p2.x} y2={p2.y} 
                stroke={hasScore ? "#3b82f6" : "#e5e7eb"} 
                strokeWidth={hasScore ? 2.5 : 1.2}
              />
              
              {/* 比分顯示 */}
              {hasScore && (
                <>
                  <g transform={`translate(${s1Pos.x}, ${s1Pos.y})`}>
                    <circle 
                      r="12" 
                      fill="white" stroke="#3b82f6" strokeWidth="1.5"
                      className="drop-shadow-sm"
                    />
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      className="font-bold fill-blue-700 pointer-events-none"
                      style={{ fontSize: '11px', fontWeight: '800' }}
                      dy="1"
                    >
                      {match.s1}
                    </text>
                  </g>

                  <g transform={`translate(${s2Pos.x}, ${s2Pos.y})`}>
                    <circle 
                      r="12" 
                      fill="white" stroke="#3b82f6" strokeWidth="1.5"
                      className="drop-shadow-sm"
                    />
                    <text 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      className="font-bold fill-blue-700 pointer-events-none"
                      style={{ fontSize: '11px', fontWeight: '800' }}
                      dy="1"
                    >
                      {match.s2}
                    </text>
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* 繪製頂點 (Players) */}
        {playerCoords.map((coord, i) => {
          const playerName = group.players[i].name;
          const rectWidth = Math.max(60, playerName.length * 9 + 16); 
          const rectHeight = 24;

          return (
            <g key={i}>
              <rect 
                x={coord.x - rectWidth / 2} 
                y={coord.y - rectHeight / 2} 
                width={rectWidth} 
                height={rectHeight} 
                rx="4"
                fill="white" 
                stroke="#64748b" 
                strokeWidth="1.5" 
                className="drop-shadow-md"
              />
              <text 
                x={coord.x} 
                y={coord.y} 
                dy="1"
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-xs font-bold fill-gray-800 pointer-events-none"
                style={{ fontSize: '11px' }}
              >
                 {playerName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// --- 單淘汰賽邏輯 ---
const generateInitialBracket = (numParticipants) => {
  const rounds = [];
  let currentRoundSize = numParticipants / 2;
  const totalRounds = Math.log2(numParticipants);

  for (let r = 0; r < totalRounds; r++) {
    const matches = [];
    for (let m = 0; m < currentRoundSize; m++) {
      matches.push({
        id: `r${r}-m${m}`,
        roundIndex: r,
        matchIndex: m,
        p1: r === 0 ? `選手 ${m * 2 + 1}` : null,
        p2: r === 0 ? `選手 ${m * 2 + 2}` : null,
        s1: '',
        s2: '',
        winner: null
      });
    }
    rounds.push(matches);
    currentRoundSize /= 2;
  }
  rounds.push([{ id: `champion`, isChampion: true, winnerName: "待定冠軍" }]);
  return rounds;
};

// --- 循環賽工具函數 ---
const createSingleGroup = (name, numPlayers) => {
    const id = Date.now() + Math.random(); // 確保 ID 唯一
    const players = Array.from({ length: numPlayers }, (_, i) => ({ 
      id: `p-${id}-${i}`, 
      name: `隊伍 ${i + 1}` 
    }));
    
    const matches = [];
    for (let i = 0; i < numPlayers; i++) {
      for (let j = i + 1; j < numPlayers; j++) {
        matches.push({
          id: `m-${id}-${i}-${j}`,
          p1Index: i,
          p2Index: j,
          s1: '',
          s2: '',
          winner: null
        });
      }
    }
    return { id, name, players, matches };
};

// 計算單一組別的積分榜
const calculateGroupStandings = (group) => {
  const standings = group.players.map(p => ({
    ...p,
    played: 0,
    won: 0,
    lost: 0,
    draw: 0,
    points: 0,
    scoreDiff: 0
  }));

  group.matches.forEach(m => {
    const s1 = m.s1 === '' ? -1 : parseInt(m.s1);
    const s2 = m.s2 === '' ? -1 : parseInt(m.s2);

    if (s1 !== -1 && s2 !== -1) {
      const p1 = standings[m.p1Index];
      const p2 = standings[m.p2Index];

      p1.played++;
      p2.played++;
      p1.scoreDiff += (s1 - s2);
      p2.scoreDiff += (s2 - s1);

      if (s1 > s2) {
        p1.won++;
        p1.points += 2; 
        p2.lost++;
        p2.points += 1;
      } else if (s2 > s1) {
        p2.won++;
        p2.points += 2;
        p1.lost++;
        p1.points += 1;
      } else {
        p1.draw++;
        p2.draw++;
        p1.points += 1.5;
        p2.points += 1.5;
      }
    }
  });

  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.scoreDiff !== a.scoreDiff) return b.scoreDiff - a.scoreDiff;
    return b.won - a.won;
  });
};


const TournamentManager = () => {
  const [mode, setMode] = useState('elimination'); // 'elimination' | 'roundRobin'
  const [isClient, setIsClient] = useState(false);

  // 單淘汰狀態
  const [elimSize, setElimSize] = useState(8);
  const [bracket, setBracket] = useState([]);

  // 循環賽狀態
  const [rrGroups, setRrGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null); // 指向 rrGroups 的 index

  // 用於新增分組的 UI 狀態
  const [newGroupSize, setNewGroupSize] = useState(3);

  // 確認視窗狀態
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    // 初始化
    setBracket(generateInitialBracket(elimSize));
    // 預設給一個 3 人循環組
    setRrGroups([createSingleGroup("Group A", 3)]);
    setIsClient(true);
  }, []); 

  // 監聽 elimSize 變化
  useEffect(() => {
    setBracket(generateInitialBracket(elimSize));
  }, [elimSize]);

  // --- 單淘汰 Handler ---
  const handleNameChange = (roundIndex, matchIndex, playerKey, newName) => {
    const newBracket = [...bracket];
    newBracket[roundIndex][matchIndex][playerKey] = newName;
    propagateUpdates(newBracket, roundIndex, matchIndex);
    setBracket(newBracket);
  };

  const handleElimScoreChange = (roundIndex, matchIndex, scoreKey, newScore) => {
    const newBracket = [...bracket];
    const match = newBracket[roundIndex][matchIndex];
    match[scoreKey] = newScore;
    
    const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
    const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
    let winnerName = null;
    let winnerIndex = null;

    if (s1 !== -1 && s2 !== -1) {
      if (s1 > s2) { winnerName = match.p1; winnerIndex = 0; }
      else if (s2 > s1) { winnerName = match.p2; winnerIndex = 1; }
    }
    match.winner = winnerIndex;

    const nextRoundIndex = roundIndex + 1;
    if (nextRoundIndex < newBracket.length) {
      if (newBracket[nextRoundIndex][0].isChampion) {
         newBracket[nextRoundIndex][0].winnerName = winnerName || "待定冠軍";
      } else {
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const playerSlot = matchIndex % 2 === 0 ? 'p1' : 'p2';
        newBracket[nextRoundIndex][nextMatchIndex][playerSlot] = winnerName;
        propagateUpdates(newBracket, nextRoundIndex, nextMatchIndex);
      }
    }
    setBracket(newBracket);
  };

  const propagateUpdates = (currentBracket, rIdx, mIdx) => {
    if (rIdx >= currentBracket.length - 1) return;
    if (currentBracket[rIdx][mIdx].isChampion) return;

    const match = currentBracket[rIdx][mIdx];
    const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
    const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
    
    let winnerName = null;
    if (s1 !== -1 && s2 !== -1) {
      if (s1 > s2) winnerName = match.p1;
      else if (s2 > s1) winnerName = match.p2;
    }

    const nextRoundIndex = rIdx + 1;
    if (currentBracket[nextRoundIndex][0].isChampion) {
       currentBracket[nextRoundIndex][0].winnerName = winnerName || "待定冠軍";
    } else {
      const nextMatchIndex = Math.floor(mIdx / 2);
      const playerSlot = mIdx % 2 === 0 ? 'p1' : 'p2';
      const nextMatch = currentBracket[nextRoundIndex][nextMatchIndex];
      if (nextMatch[playerSlot] !== winnerName) {
        nextMatch[playerSlot] = winnerName;
        propagateUpdates(currentBracket, nextRoundIndex, nextMatchIndex);
      }
    }
  };

  // --- 循環賽 Handler ---
  const handleAddGroup = () => {
      const nextLetter = String.fromCharCode(65 + rrGroups.length); // A, B, C...
      const newGroup = createSingleGroup(`Group ${nextLetter}`, newGroupSize);
      setRrGroups([...rrGroups, newGroup]);
  };

  // 修改：刪除按鈕邏輯 (改用自定義 Dialog)
  const handleDeleteGroup = (e, groupId) => {
      e.stopPropagation();
      e.preventDefault(); 
      
      setConfirmState({
        isOpen: true,
        message: "確定要刪除此分組嗎？此操作無法復原。",
        onConfirm: () => {
          const newGroups = rrGroups.filter(g => g.id !== groupId);
          setRrGroups(newGroups);
          setConfirmState({ isOpen: false, message: '', onConfirm: null });
        }
      });
  };

  const handleRrNameChange = (groupIndex, playerIndex, newName) => {
    const newGroups = [...rrGroups];
    newGroups[groupIndex].players[playerIndex].name = newName;
    setRrGroups(newGroups);
  };

  const handleRrScoreChange = (groupIndex, matchId, scoreKey, newScore) => {
    const newGroups = [...rrGroups];
    const group = newGroups[groupIndex];
    const match = group.matches.find(m => m.id === matchId);
    
    if (match) {
      match[scoreKey] = newScore;
      const s1 = match.s1 === '' ? -1 : parseInt(match.s1);
      const s2 = match.s2 === '' ? -1 : parseInt(match.s2);
      
      if (s1 !== -1 && s2 !== -1) {
        if (s1 > s2) match.winner = 0;
        else if (s2 > s1) match.winner = 1;
        else match.winner = -1;
      } else {
        match.winner = null;
      }
      setRrGroups(newGroups);
    }
  };

  const resetTournament = () => {
    setConfirmState({
        isOpen: true,
        message: "確定要重置所有賽程嗎？所有目前的比分將會遺失。",
        onConfirm: () => {
          if (mode === 'elimination') setBracket(generateInitialBracket(elimSize));
          else setRrGroups([createSingleGroup("Group A", 3)]);
          setConfirmState({ isOpen: false, message: '', onConfirm: null });
        }
    });
  };

  const closeConfirm = () => {
    setConfirmState({ isOpen: false, message: '', onConfirm: null });
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
      
      {/* 自定義確認視窗 */}
      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Trophy size={20} />
            </div>
            <h1 className="text-lg font-bold text-gray-900">賽事管理系統</h1>
            
            {/* 模式切換 */}
            <div className="flex bg-gray-100 p-1 rounded-lg ml-4">
              <button
                onClick={() => { setMode('elimination'); setActiveGroupId(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'elimination' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <GitMerge size={16} />
                單淘汰
              </button>
              <button
                onClick={() => setMode('roundRobin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'roundRobin' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Grid size={16} />
                循環賽
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === 'elimination' ? (
              <select 
                value={elimSize} 
                onChange={(e) => setElimSize(parseInt(e.target.value))}
                className="bg-gray-100 border-none text-sm font-bold text-gray-900 rounded px-2 py-1.5 cursor-pointer"
              >
                <option value={4}>4人制</option>
                <option value={8}>8人制</option>
                <option value={16}>16人制</option>
                <option value={32}>32人制</option>
                <option value={64}>64人制</option>
                <option value={128}>128人制</option>
              </select>
            ) : (
              // 循環賽設定 (僅在總覽模式顯示)
              activeGroupId === null && (
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium pl-2 text-gray-500">新增分組：</span>
                    <select 
                        value={newGroupSize} 
                        onChange={(e) => setNewGroupSize(parseInt(e.target.value))}
                        className="bg-white border border-gray-200 text-sm font-bold text-gray-900 rounded px-2 py-1 cursor-pointer"
                    >
                        <option value={3}>3 人</option>
                        <option value={4}>4 人</option>
                        <option value={5}>5 人</option>
                    </select>
                    <button 
                        onClick={handleAddGroup}
                        className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm font-bold"
                    >
                        <PlusCircle size={14} />
                        新增
                    </button>
                </div>
              )
            )}

            <button 
              onClick={resetTournament}
              className="p-2 text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              title="重置"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 overflow-x-auto min-h-[500px]">
        
        {/* 單淘汰賽視圖 */}
        {mode === 'elimination' && (
          <div className="flex gap-8 min-w-max mx-auto px-2 pb-12 pt-8">
            {bracket.map((round, rIndex) => {
              const isChampionRound = round.length === 1 && round[0].isChampion;
              return (
                <div key={rIndex} className="flex flex-col justify-around relative min-w-[320px]">
                  {/* Title */}
                  <div className="absolute -top-8 left-0 w-full text-center text-sm font-bold text-gray-500 bg-gray-100 rounded-full py-1">
                    {isChampionRound ? '最終冠軍' : 
                     rIndex === bracket.length - 2 ? '總決賽' : 
                     rIndex === bracket.length - 3 ? '準決賽' : 
                     `第 ${rIndex + 1} 輪`}
                  </div>

                  {round.map((match, mIndex) => {
                    if (match.isChampion) {
                      return (
                        <div key="champ" className="flex items-center justify-center h-full pl-4">
                          <div className="bg-gradient-to-br from-yellow-50 to-white border-4 border-yellow-400 rounded-xl p-6 text-center shadow-xl w-64">
                            <Trophy size={48} className="mx-auto text-yellow-500 mb-2" />
                            <div className="text-xs text-yellow-600 font-bold uppercase mb-1">WINNER</div>
                            <div className="text-xl font-bold text-gray-900 break-words">{match.winnerName}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={match.id} className="relative group w-80 my-2">
                         {/* Lines */}
                        {rIndex < bracket.length - 2 && (
                          <>
                            <div className="absolute top-1/2 -right-4 w-4 h-0.5 bg-gray-300"></div>
                            <div className="absolute -right-4 w-0.5 bg-gray-300"
                              style={{
                                height: '100%',
                                top: mIndex % 2 === 0 ? '50%' : 'auto',
                                bottom: mIndex % 2 !== 0 ? '50%' : 'auto',
                                display: mIndex % 2 === 0 ? 'block' : 'none',
                                borderTopRightRadius: mIndex % 2 === 0 ? '4px' : '0',
                              }}
                            ></div>
                            {mIndex % 2 === 0 && (
                              <div className="absolute -right-4 w-0.5 bg-gray-300" style={{ top: '50%', height: 'calc(100% + 100% + 1rem)' }} />
                            )}
                          </>
                        )}

                        <div className="bg-white border-2 border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                          {/* Player 1 */}
                          <div className={`flex items-center p-2 border-b border-gray-100 transition-colors h-16 ${match.winner === 0 ? 'bg-green-50' : ''}`}>
                            <div className="w-6 text-center text-xs font-bold text-gray-400 flex-shrink-0">{rIndex === 0 ? (mIndex * 2 + 1) : ''}</div>
                            <input 
                              type="text" 
                              value={match.p1 || ''}
                              onChange={(e) => rIndex === 0 && handleNameChange(rIndex, mIndex, 'p1', e.target.value)}
                              disabled={rIndex !== 0}
                              placeholder={rIndex === 0 ? "選手 1" : ""}
                              className={`w-28 px-2 py-1 text-base bg-transparent border-none focus:ring-0 truncate ${match.winner === 0 ? 'font-bold text-green-700' : 'text-gray-800'}`}
                            />
                            <div className="ml-auto mr-2">
                              <ScoreControl 
                                score={match.s1} 
                                onChange={(val) => handleElimScoreChange(rIndex, mIndex, 's1', val)} 
                                colorClass={match.winner === 0 ? 'text-green-700 font-bold' : 'text-gray-800'}
                              />
                            </div>
                          </div>

                          {/* Player 2 */}
                          <div className={`flex items-center p-2 transition-colors h-16 ${match.winner === 1 ? 'bg-green-50' : ''}`}>
                            <div className="w-6 text-center text-xs font-bold text-gray-400 flex-shrink-0">{rIndex === 0 ? (mIndex * 2 + 2) : ''}</div>
                            <input 
                              type="text" 
                              value={match.p2 || ''}
                              onChange={(e) => rIndex === 0 && handleNameChange(rIndex, mIndex, 'p2', e.target.value)}
                              disabled={rIndex !== 0}
                              placeholder={rIndex === 0 ? "選手 2" : ""}
                              className={`w-28 px-2 py-1 text-base bg-transparent border-none focus:ring-0 truncate ${match.winner === 1 ? 'font-bold text-green-700' : 'text-gray-800'}`}
                            />
                            <div className="ml-auto mr-2">
                              <ScoreControl 
                                score={match.s2} 
                                onChange={(val) => handleElimScoreChange(rIndex, mIndex, 's2', val)} 
                                colorClass={match.winner === 1 ? 'text-green-700 font-bold' : 'text-gray-800'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* 循環賽視圖 */}
        {mode === 'roundRobin' && (
          <div className="max-w-7xl mx-auto">
            
            {/* LEVEL 1: 分組總覽 (Dashboard) */}
            {activeGroupId === null && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {rrGroups.map((group, gIndex) => {
                        return (
                            <div 
                                key={group.id} 
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all group overflow-hidden relative"
                            >
                                {/* 修改重點：刪除按鈕獨立在絕對定位層，z-index 最高 */}
                                <button 
                                    onClick={(e) => handleDeleteGroup(e, group.id)}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 bg-white hover:text-red-500 hover:bg-red-50 rounded-full shadow-sm border border-gray-100 transition-colors z-50 cursor-pointer"
                                    title="刪除分組"
                                >
                                    <Trash2 size={16} />
                                </button>

                                {/* 修改重點：只有內部這個 div 負責跳轉，避開了刪除按鈕 */}
                                <div 
                                    onClick={() => setActiveGroupId(gIndex)}
                                    className="cursor-pointer h-full"
                                >
                                    <div className="bg-gray-50 p-3 border-b border-gray-100 pr-12"> {/* pr-12 避免文字蓋到按鈕 */}
                                        <h3 className="font-bold text-lg text-gray-800 truncate">{group.name} ({group.players.length}人循環)</h3>
                                    </div>
                                    
                                    {/* 幾何視覺化區域 */}
                                    <div className="bg-white">
                                        <RoundRobinPolygon group={group} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* 空狀態提示 */}
                    {rrGroups.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                            <Grid size={48} className="mx-auto mb-2 opacity-50" />
                            <p>目前沒有分組，請從上方新增分組。</p>
                        </div>
                    )}
                </div>
            )}

            {/* LEVEL 2: 單一組別詳細視圖 */}
            {activeGroupId !== null && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    {/* 返回按鈕列 */}
                    <div className="flex items-center gap-4 mb-6">
                        <button 
                            onClick={() => setActiveGroupId(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium transition-colors"
                        >
                            <ArrowLeft size={18} />
                            返回分組總覽
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900">{rrGroups[activeGroupId].name} 詳細賽況</h2>
                    </div>

                    {/* 1. 選手名單輸入 */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-500" />
                            參賽隊伍設定
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {rrGroups[activeGroupId].players.map((player, index) => (
                                <div key={player.id} className="flex items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <span className="w-8 text-center font-mono font-bold text-gray-400">{index + 1}</span>
                                    <input
                                        type="text"
                                        value={player.name}
                                        onChange={(e) => handleRrNameChange(activeGroupId, index, e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 w-full text-gray-800 font-medium"
                                        placeholder={`選手 ${index + 1}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 2. 積分榜 */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 order-2 lg:order-1">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                即時積分榜
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-3">排名</th>
                                            <th className="px-3 py-3">隊伍</th>
                                            <th className="px-3 py-3 text-center">賽</th>
                                            <th className="px-3 py-3 text-center">勝</th>
                                            <th className="px-3 py-3 text-center">負</th>
                                            <th className="px-3 py-3 text-center">淨分</th>
                                            <th className="px-3 py-3 text-center font-bold text-blue-600">積分</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculateGroupStandings(rrGroups[activeGroupId]).map((p, idx) => (
                                            <tr key={p.id} className="border-b hover:bg-gray-50">
                                                <td className="px-3 py-3 font-bold text-gray-400">
                                                    {idx === 0 ? <Trophy size={16} className="text-yellow-400 inline" /> : idx + 1}
                                                </td>
                                                <td className="px-3 py-3 font-medium text-gray-900">{p.name}</td>
                                                <td className="px-3 py-3 text-center">{p.played}</td>
                                                <td className="px-3 py-3 text-center text-green-600 font-bold">{p.won}</td>
                                                <td className="px-3 py-3 text-center text-red-400">{p.lost}</td>
                                                <td className="px-3 py-3 text-center text-gray-500">{p.scoreDiff > 0 ? `+${p.scoreDiff}` : p.scoreDiff}</td>
                                                <td className="px-3 py-3 text-center font-bold text-blue-600 text-lg">{p.points}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 3. 對戰列表 */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 order-1 lg:order-2">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Grid size={20} className="text-purple-500" />
                                對戰賽程
                            </h2>
                            <div className="space-y-3">
                                {rrGroups[activeGroupId].matches.map((match) => (
                                    <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors bg-white">
                                        <div className={`flex-1 text-right pr-4 font-medium ${match.winner === 0 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                                            {rrGroups[activeGroupId].players[match.p1Index].name}
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <ScoreControl 
                                                score={match.s1} 
                                                onChange={(val) => handleRrScoreChange(activeGroupId, match.id, 's1', val)} 
                                                colorClass={match.winner === 0 ? 'text-green-600' : ''}
                                            />
                                            <span className="text-gray-300 font-bold">:</span>
                                            <ScoreControl 
                                                score={match.s2} 
                                                onChange={(val) => handleRrScoreChange(activeGroupId, match.id, 's2', val)} 
                                                colorClass={match.winner === 1 ? 'text-green-600' : ''}
                                            />
                                        </div>

                                        <div className={`flex-1 text-left pl-4 font-medium ${match.winner === 1 ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                                            {rrGroups[activeGroupId].players[match.p2Index].name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};

export default TournamentManager;