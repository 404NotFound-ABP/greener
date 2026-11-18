import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ServiceModal, type ModalServiceData } from './ServiceModal';

const fechar = vi.fn();

const servico = (status: ModalServiceData['status']): ModalServiceData => ({
  id: 1,
  name: 'Servidor Centro',
  status,
  location: 'São Paulo',
});

describe('modal de serviço', () => {
  it('mostra localização e permite fechar', () => {
    render(<ServiceModal service={servico('ativo')} onClose={fechar} />);

    expect(screen.getByText('Servidor Centro')).toBeInTheDocument();
    expect(screen.getByText('Cidade: São Paulo')).toBeInTheDocument();
    expect(screen.getByText('Indicadores ambientais')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Armazenamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver dashboard completo' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(fechar).toHaveBeenCalled();
  });

  it('distingue serviço indisponível e último valor conhecido', () => {
    render(<ServiceModal service={servico('indisponível')} />);

    expect(screen.getAllByText(/indisponível/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Última leitura registrada/)).toBeInTheDocument();
  });

  it('não apresenta métricas simuladas como reais quando não há dados', () => {
    render(<ServiceModal service={servico('sem_metricas')} />);

    expect(screen.getByText(/nenhuma métrica recebida/i)).toBeInTheDocument();
    expect(screen.getByText('Este serviço ainda não envia dados')).toBeInTheDocument();
    expect(screen.queryByText(/100/)).not.toBeInTheDocument();
  });
});
