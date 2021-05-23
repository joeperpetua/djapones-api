import React from 'react';
import ReactFuri from 'react-furi';
import styled from 'styled-components';

import './ResultCard.css';

const MyWrapper = styled(ReactFuri.Wrapper.withComponent('h1'))`
    
`;
const CustomFurigana = styled(ReactFuri.Furi)`
    font-size: medium;
    font-weight: 400;
    user-select: text;
`;  
const CustomText = styled(ReactFuri.Text)`
    font-size: xx-large;
    font-weight: 500;
`;

const CustomKana = (kana, reading) => (
    <ReactFuri
      word={kana}
      reading={reading}
      render={({ pairs }) => (
        <MyWrapper lang="ja">
          {pairs.map(([furigana, text], index) => (
            <ReactFuri.Pair key={index}>
              <CustomFurigana>{furigana}</CustomFurigana>
              <CustomText>{text}</CustomText>
            </ReactFuri.Pair>
          ))}
        </MyWrapper>
      )}
    />
);

const Definition = (definition) => (
    <div>
        <p className="definition-type">{definition.type}</p>
        <p className="definition-text">{definition.text}</p>
    </div>
);

class ResultCard extends React.Component{
    // constructor(props){
    //     super(props);
    // }

    render(){
        console.log(this.props.data)
        const data = this.props.data;
        //const { kana, reading, spanishDefs} = this.props.data;
        return(
            <div className="ResultCard">
                <div className="kana-container">
                    {CustomKana(data.japanese[0].word, data.japanese[0].reading)}
                    {Definition(data.spanishDefs[0])}
                </div>
                
                <div className="definition-container">
                    {data.spanishDefs.map((definition, index) => (
                        <div key={index}>
                            {index === 0 ? null : Definition(definition)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
        



}

export default ResultCard;