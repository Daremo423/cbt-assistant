import React from 'react';

export const ReframeWindow = ({ reframes }) => (
  <div style={{background:'#e3f6f5',padding:'1em',borderRadius:'8px',minHeight:'80px',marginTop:'1em'}}>
    <b>Reframes:</b>
    <ul>
    {reframes.map((r,i) => <li key={i}>{r}</li>)}
    </ul>
  </div>
);
