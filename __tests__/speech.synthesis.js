import { timeouts } from './constants.json';

import minNumActivitiesShown from './setup/conditions/minNumActivitiesShown';
import speechRecognitionStartCalled from './setup/conditions/speechRecognitionStartCalled';
import speechSynthesisUtterancePended from './setup/conditions/speechSynthesisUtterancePended';

// selenium-webdriver API doc:
// https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html

jest.setTimeout(timeouts.test);

describe('speech synthesis', () => {
  // Verification of fix of #1736, https://github.com/microsoft/BotFramework-WebChat/issues/1736
  test('should synthesize two consecutive messages', async () => {
    const { driver, pageObjects } = await setupWebDriver({
      props: {
        webSpeechPonyfillFactory: () => window.WebSpeechMock
      }
    });

    await pageObjects.sendMessageViaMicrophone('echo 123');

    await driver.wait(minNumActivitiesShown(3), timeouts.directLine);
    await driver.wait(speechSynthesisUtterancePended(), timeouts.ui);

    await expect(pageObjects.startSpeechSynthesize()).resolves.toHaveProperty(
      'text',
      'Echoing back in a separate activity.'
    );

    await pageObjects.endSpeechSynthesize();

    await expect(pageObjects.startSpeechSynthesize()).resolves.toHaveProperty('text', '123');

    await pageObjects.endSpeechSynthesize();
  });

  // Verification of fix of #2096, https://github.com/microsoft/BotFramework-WebChat/issues/2096
  test('should synthesize speak property of Adaptive Card', async () => {
    const { driver, pageObjects } = await setupWebDriver({
      props: {
        webSpeechPonyfillFactory: () => window.WebSpeechMock
      }
    });

    await pageObjects.sendMessageViaMicrophone('card bingsports');

    await driver.wait(minNumActivitiesShown(2), timeouts.directLine);
    await driver.wait(speechSynthesisUtterancePended(), timeouts.ui);

    await expect(pageObjects.startSpeechSynthesize()).resolves.toHaveProperty(
      'text',
      'Showing  bingsports\r\nThe Seattle Seahawks beat the Carolina Panthers 40-7'
    );

    await pageObjects.endSpeechSynthesize();
  });

  test('should start recognition after failing on speech synthesis with activity of expecting input', async () => {
    const { driver, pageObjects } = await setupWebDriver({
      props: {
        webSpeechPonyfillFactory: () => window.WebSpeechMock
      }
    });

    await pageObjects.sendMessageViaMicrophone('hint expecting');

    await expect(speechRecognitionStartCalled().fn(driver)).resolves.toBeFalsy();
    await driver.wait(minNumActivitiesShown(2), timeouts.directLine);
    await driver.wait(speechSynthesisUtterancePended(), timeouts.ui);

    await pageObjects.startSpeechSynthesize();
    await pageObjects.errorSpeechSynthesize();

    await expect(speechRecognitionStartCalled().fn(driver)).resolves.toBeTruthy();
  });
});
