import { svg, VNode } from '@cycle/dom';

const season = '20222023';

export function fetchTeamLogoSVGSymbols(): void {
  // Adapted from https://css-tricks.com/ajaxing-svg-sprite/
  const ajax = new XMLHttpRequest();
  ajax.open(
    'GET',
    `https://www-league.nhlstatic.com/images/logos/team-sprites/${season}.svg`,
    true,
  );
  ajax.send();
  ajax.onload = () => {
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = ajax.responseText;
    document.body.insertBefore(div, document.body.childNodes[0]);
  };
}

export function renderTeamLogo(teamId: number, className: string): VNode {
  return svg({ attrs: { class: className } }, [
    svg.use({ attrs: { href: `#team-${teamId}-${season}-dark` } }),
  ]);
}
