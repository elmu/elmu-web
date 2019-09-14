const React = require('react');
const Button = require('antd/lib/button');
const arrayShuffle = require('array-shuffle');
const Markdown = require('../../../components/markdown.jsx');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');

function QuickTesterDisplay({ content }) {
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [isAnswerVisible, setIsAnswerVisible] = React.useState(false);
  const [tests, setTests] = React.useState(arrayShuffle(content.tests));

  React.useEffect(() => {
    setCurrentIndex(-1);
    setIsAnswerVisible(false);
    setTests(arrayShuffle(content.tests));
  }, [content.tests]);

  const showAnswer = React.useCallback(() => {
    setIsAnswerVisible(true);
  }, [setIsAnswerVisible]);

  const moveToIndex = React.useCallback(valOrFunc => {
    setIsAnswerVisible(false);
    setCurrentIndex(valOrFunc);
  }, [setIsAnswerVisible, setCurrentIndex]);

  const movePrevious = React.useCallback(() => {
    moveToIndex(i => i - 1);
  }, [moveToIndex]);

  const moveNext = React.useCallback(() => {
    moveToIndex(i => i + 1);
  }, [moveToIndex]);

  const close = React.useCallback(() => {
    moveToIndex(-1);
  }, [moveToIndex]);

  const restart = React.useCallback(() => {
    setTests(arrayShuffle(content.tests));
    moveToIndex(content.tests.length ? 0 : -1);
  }, [setTests, content.tests, moveToIndex]);

  const percentDone = React.useMemo(() => {
    return tests.length
      ? Math.max(0, Math.min(100, Math.round(((currentIndex + 1) / tests.length) * 100)))
      : 100;
  }, [currentIndex, tests.length]);

  if (currentIndex === -1 || !tests.length) {
    return (
      <div className="QuickTester">
        <div className="QuickTester-content">
          <Markdown
            tag="a"
            className="QuickTester-initLink"
            onClick={restart}
            inline
            >
            {content.teaser}
          </Markdown>
        </div>
      </div>
    );
  }

  const answerDisplay = isAnswerVisible
    ? <Markdown inline>{tests[currentIndex].answer}</Markdown>
    : <Button type="primary" size="large" onClick={showAnswer}>Antwort anzeigen</Button>;

  return (
    <div className="QuickTester">
      <div className="QuickTester-content">
        <div className="QuickTester-header">
          <div className="QuickTester-title">
            <Markdown inline>{content.title}</Markdown>
          </div>
          <div className="QuickTester-closeButton">
            <Button size="small" icon="close" onClick={close} ghost />
          </div>
        </div>
        <div className="QuickTester-progress" style={{ width: `${percentDone}%` }} />
        <div className="QuickTester-test">
          <div className="QuickTester-question">
            <div className="QuickTester-questionHeader">Frage {currentIndex + 1} von {tests.length}</div>
            <Markdown>{tests[currentIndex].question}</Markdown>
          </div>
          <div className="QuickTester-answer">
            {answerDisplay}
          </div>
        </div>
        <div className="QuickTester-buttons">
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="left"
            disabled={currentIndex === 0}
            onClick={movePrevious}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="reload"
            onClick={restart}
            />
          <Button
            className="QuickTester-button"
            shape="circle"
            icon="right"
            disabled={!isAnswerVisible || currentIndex === tests.length - 1}
            onClick={moveNext}
            />
        </div>
      </div>
    </div>
  );
}

QuickTesterDisplay.propTypes = {
  ...sectionDisplayProps
};

module.exports = QuickTesterDisplay;
