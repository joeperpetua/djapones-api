import React from 'react';

import './ResultCard.css';

class ResultCard extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        const { kana, furigana, spanishDefs} = this.props.data;
        return(
            <div className="ResultCard">
                <div className="kana-container">
                    <p className="kana-furigana">{furigana}</p>
                    <p className="kana-text">{kana}</p>
                </div>
                <div className="definition-container">
                    {spanishDefs.map(definition => (
                        <div key={definition.meaning}>
                            <p className="definition-type">{definition.type}</p>
                            <p className="definition-text">{definition.meaning}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
        



}

export default ResultCard;