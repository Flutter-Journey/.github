module.exports = async ({github, context}) => {
    const query = `query($owner:String!, $name:String!, $issue_number:Int!) {
      repository(owner:$owner, name:$name){
        issue(number:$issue_number) {
          comments(first:10,orderBy:{direction:DESC, field:UPDATED_AT}) {
            nodes {
              author {
                avatarUrl(size: 24)
                login
                url
              }
              url
              bodyText
              updatedAt
            }
          }
        }
      }
    }`;
    const variables = {
      owner: context.repo.owner,
      name: context.repo.repo,
      issue_number: context.issue.number
    }
    const result = await github.graphql(query, variables);

    const renderComments = (comments) => {
      return comments.reduce((prev, curr) => {
        let sanitizedText = curr.bodyText.replace('<', '&lt;').replace('>', '&gt;').replace(/(\r\n|\r|\n)/g, "<br />").replace('|', '&#124;').replace('[', '&#91;');

        // Convert updatedAt to a date with UTC+7 timezone
        let date = new Date(curr.updatedAt);
        let formattedDate = date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

        return `${prev}|[<img src="${curr.author.avatarUrl}" alt="${curr.author.login}" width="24" />  ${curr.author.login}](${curr.author.url})|${formattedDate} (UTC+7)|${sanitizedText}|\n`;
      }, "| Name | Date | Message |\n|---|---|---|\n");
    };

    const fileSystem = require('fs');
    const path = require('path');

    module.exports = ({ github, context }) => {
      // Path to file README.md in ./profile/
      const readmePath = path.join(__dirname, '..', 'profile', 'README.md');

      // Read README.md content
      const readme = fileSystem.readFileSync(readmePath, 'utf8');

      // Process and write the updated content
      const updatedReadme = readme.replace(
        /(?<=<!-- PublicChatGroup -->\s*\n)[\S\s]*?(?=\s*<!-- \/PublicChatGroup -->|$(?![\n]))/gm,
        renderComments(result.repository.issue.comments.nodes)
      );

      console.log(result.repository.issue.comments.nodes);

      console.log(renderComments(result.repository.issue.comments.nodes))


      fileSystem.writeFileSync(readmePath, updatedReadme, 'utf8');
    };
  }