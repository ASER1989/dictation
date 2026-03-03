import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { envConfig } from './config/env';
import { useFrontendProxy } from './middlewares/frontendProxy';
import { useResponseFormatter } from './middlewares/responseFormatter';
import helloRouters from './routes/hello';
import vocabularyRouters from './routes/vocabularies';
import clientVocabularyRouters from './routes/clientVocabulary';

const app = new Koa();

app
  .use(
    bodyParser({
      formLimit: '30mb',
      jsonLimit: '30mb',
    })
  )
  .use(useResponseFormatter())
  .use(helloRouters('/api'))
  .use(vocabularyRouters('/api'))
  .use(clientVocabularyRouters('/api'))
  .use(useFrontendProxy(envConfig.frontendDistDirPath));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
