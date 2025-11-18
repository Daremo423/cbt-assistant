import React from 'react';

export const TranscriptionWindow = ({ transcript, highlights }) => (
  <div style={{background:'#fff',padding:'1em',borderRadius:'8px',minHeight:'120px',fontFamily:'monospace'}}>
    {transcript.split(' ').map((word,i)=>
      highlights[i] 
        ? <span key={i} style={{background:'#ffe066',borderRadius:'4px'}}>{word+' '}</span>
        : <span key={i}>{word+' '}</span>
    )}
  </div>
);
