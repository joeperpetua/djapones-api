import React from 'react';
import ReactFuri from 'react-furi';

import './ResultCard.css';

class ResultCard extends React.Component{
    constructor(props){
        super(props);
    }

    render(){
        const { kana, reading, spanishDefs} = this.props.data;
        return(
            <div className="ResultCard">
                <div className="kana-container">
                    <ReactFuri word={kana} reading={reading} />
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