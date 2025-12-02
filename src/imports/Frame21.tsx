import svgPaths from "./svg-z26xnr8a78";
import { imgGroup, imgGroup1 } from "./svg-93i1b";

function Component() {
  return (
    <div className="absolute inset-[7.69%_29.25%_88.03%_29.39%]" data-name="04">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 311 45">
        <g id="04">
          <path d={svgPaths.p32fb2e80} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p1aea3200} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p325e8a80} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p2474bc00} fill="var(--fill-0, white)" id="Vector_4" />
          <path d={svgPaths.p16ef09f0} fill="var(--fill-0, white)" id="Vector_5" />
          <path d={svgPaths.p3acc5480} fill="var(--fill-0, white)" id="Vector_6" />
          <path d={svgPaths.p142a400} fill="var(--fill-0, white)" id="Vector_7" />
          <path d={svgPaths.pe197800} fill="var(--fill-0, white)" id="Vector_8" />
        </g>
      </svg>
    </div>
  );
}

function Camada() {
  return (
    <div className="absolute contents inset-[7.69%_29.25%_88.03%_29.39%]" data-name="Camada 2">
      <Component />
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[31.52%_17.32%_31.63%_17.55%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.002px_4.117px] mask-size-[488.999px_381.199px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 490 389">
        <g id="Group">
          <path d={svgPaths.p1b8a500} fill="var(--fill-0, #9C7B0E)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-[31.91%_17.42%_31.89%_17.55%]" data-name="Clip path group">
      <Group />
    </div>
  );
}

function Camada1() {
  return (
    <div className="absolute contents inset-[31.91%_17.42%_31.89%_17.55%]" data-name="Camada 3">
      <ClipPathGroup />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute inset-[31.52%_17.32%_31.63%_17.55%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.002px_4.117px] mask-size-[489px_381.2px]" data-name="Group" style={{ maskImage: `url('${imgGroup1}')` }}>
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 490 389">
        <g id="Group">
          <path d={svgPaths.p1e5c6c00} fill="url(#paint0_linear_32_1417)" id="Vector" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_32_1417" x1="0" x2="489.733" y1="194.049" y2="194.049">
            <stop stopColor="#D4AF37" />
            <stop offset="0.475962" stopColor="#FFEE99" />
            <stop offset="1" stopColor="#D4AF37" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ClipPathGroup1() {
  return (
    <div className="absolute contents inset-[31.91%_17.42%_31.89%_17.55%]" data-name="Clip path group">
      <Group1 />
    </div>
  );
}

function Camada2() {
  return (
    <div className="absolute contents inset-[31.91%_17.42%_31.89%_17.55%]" data-name="Camada 4">
      <ClipPathGroup1 />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="overflow-clip relative rounded-[43px] size-full">
      <div className="absolute bg-[#191919] h-[1053px] left-0 rounded-[43px] top-0 w-[752px]">
        <div aria-hidden="true" className="absolute border border-[#9c7b0e] border-solid inset-0 pointer-events-none rounded-[43px]" />
      </div>
      <div className="absolute bg-[#191919] h-[1053px] left-0 rounded-[43px] top-0 w-[752px]">
        <div aria-hidden="true" className="absolute border border-[#9c7b0e] border-solid inset-0 pointer-events-none rounded-[43px]" />
      </div>
      <div className="absolute flex flex-col font-['Copperplate_Gothic_Bold:Regular',sans-serif] justify-center leading-[0] left-[calc(50%-178px)] not-italic text-[60px] text-nowrap text-white top-[907.5px] tracking-[0.6px] translate-y-[-50%]">
        <p className="leading-[normal] whitespace-pre">WRAPPED</p>
      </div>
      <Camada />
      <Camada1 />
      <Camada2 />
    </div>
  );
}