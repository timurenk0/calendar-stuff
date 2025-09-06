const Option = ({ children, color, onClick}: {children?: React.ReactNode, color: string, onClick?: (x?: any) => void}) => {
  return (
    <button className={`bg-${color}-200 px-4 rounded-xl cursor-pointer me-8 hover:bg-${color}-300`} onClick={onClick}>
        {children}
    </button>
  )
}

export default Option